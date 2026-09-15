package com.raveliteapp.device

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.SoundPool
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.raveliteapp.R
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

/**
 * RaveLite device bridge — the native capabilities JS can't reach.
 *
 *  - Element cue playback on the ALARM audio stream (SoundPool), so chimes
 *    sound even when the ringer is silent, notification volume is 0, or Do
 *    Not Disturb lets alarms through. Other audio (e.g. TikTok) ducks for
 *    the length of the cue.
 *  - Alarm volume and the current DND interruption filter, for the Chimes
 *    settings and the "Respect Do Not Disturb" toggle.
 *  - Window backlight override for night mode: the screen stays on
 *    (FLAG_KEEP_SCREEN_ON) but barely lit outside active hours.
 *  - A rough location, once, for sunrise and the forecast.
 *
 * Old-architecture module (newArchEnabled=false), registered manually in
 * MainApplication via [RaveLiteDevicePackage].
 */
class RaveLiteDeviceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private val audioManager =
      reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
  private val mainHandler = Handler(Looper.getMainLooper())

  private val alarmAttributes: AudioAttributes =
      AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_ALARM)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()

  private val soundPool: SoundPool =
      SoundPool.Builder().setMaxStreams(2).setAudioAttributes(alarmAttributes).build()

  private val cueResources =
      mapOf(
          "fire" to R.raw.cue_fire,
          "air" to R.raw.cue_air,
          "earth" to R.raw.cue_earth,
          "water" to R.raw.cue_water,
          "heart" to R.raw.cue_heart,
      )

  /** element → SoundPool sample id. Loading is async; see [loadedSamples]. */
  private val sampleIds = mutableMapOf<String, Int>()
  private val loadedSamples = mutableSetOf<Int>()

  private var focusRequest: AudioFocusRequest? = null
  private val releaseFocus = Runnable { abandonFocus() }

  init {
    soundPool.setOnLoadCompleteListener { _, sampleId, status ->
      if (status == 0) {
        synchronized(loadedSamples) { loadedSamples.add(sampleId) }
      }
    }
    for ((element, res) in cueResources) {
      sampleIds[element] = soundPool.load(reactContext, res, 1)
    }
  }

  override fun getName(): String = NAME

  /**
   * Play an element cue on the alarm stream at [volume] (0–1, relative to the
   * alarm stream volume). Resolves false when it could not play — unknown
   * element, sample still loading, or SoundPool refused — so JS can fall back
   * to a sounding notification channel instead of going silent.
   */
  @ReactMethod
  fun playCue(element: String, volume: Double, promise: Promise) {
    val sampleId = sampleIds[element]
    val ready = sampleId != null && synchronized(loadedSamples) { loadedSamples.contains(sampleId) }
    if (!ready || volume <= 0.0) {
      promise.resolve(false)
      return
    }
    val level = volume.coerceIn(0.0, 1.0).toFloat()
    requestFocus()
    val streamId = soundPool.play(sampleId!!, level, level, 1, 0, 1f)
    if (streamId == 0) {
      abandonFocus()
      promise.resolve(false)
      return
    }
    mainHandler.removeCallbacks(releaseFocus)
    mainHandler.postDelayed(releaseFocus, FOCUS_HOLD_MS)
    promise.resolve(true)
  }

  /** Resolves `{current, max}` for the alarm stream. */
  @ReactMethod
  fun getAlarmVolume(promise: Promise) {
    val result = Arguments.createMap()
    result.putInt("current", audioManager.getStreamVolume(AudioManager.STREAM_ALARM))
    result.putInt("max", audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM))
    promise.resolve(result)
  }

  /** Resolves NotificationManager.INTERRUPTION_FILTER_* (1 = all, DND off). */
  @ReactMethod
  fun getInterruptionFilter(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(INTERRUPTION_FILTER_ALL)
      return
    }
    val notifications =
        reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    promise.resolve(notifications.currentInterruptionFilter)
  }

  /**
   * Override this activity window's backlight: [level] 0–1, or any negative
   * value to hand brightness back to the system. Resolves false when there
   * is no foreground activity to apply it to.
   */
  @ReactMethod
  fun setWindowBrightness(level: Double, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    activity.runOnUiThread {
      val attrs = activity.window.attributes
      attrs.screenBrightness =
          if (level < 0) WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
          else level.coerceIn(0.01, 1.0).toFloat()
      activity.window.attributes = attrs
      promise.resolve(true)
    }
  }

  /**
   * The phone's rough location, once. Resolves `{latitude, longitude, place?}`
   * from the freshest last-known fix under a day old, else a single network
   * (or GPS) fix, or null when location is off, not permitted, or nothing
   * arrives within 20 s. `place` is the town from Android's geocoder when it
   * has one.
   */
  @ReactMethod
  fun getCoarseLocation(promise: Promise) {
    val permitted =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            reactContext.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
    if (!permitted) {
      promise.resolve(null)
      return
    }
    val manager = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val settled = AtomicBoolean(false)
    fun settle(location: Location?) {
      if (!settled.compareAndSet(false, true)) {
        return
      }
      if (location == null) {
        promise.resolve(null)
        return
      }
      // The geocoder may go to the network: keep it off the calling thread.
      Thread {
            val result = Arguments.createMap()
            result.putDouble("latitude", location.latitude)
            result.putDouble("longitude", location.longitude)
            placeName(location)?.let { result.putString("place", it) }
            promise.resolve(result)
          }
          .start()
    }

    val lastKnown =
        manager.allProviders
            .mapNotNull { provider ->
              try {
                manager.getLastKnownLocation(provider)
              } catch (e: Exception) {
                null
              }
            }
            .maxByOrNull { it.time }
    if (lastKnown != null && System.currentTimeMillis() - lastKnown.time < LAST_FIX_MAX_AGE_MS) {
      settle(lastKnown)
      return
    }
    val provider =
        listOf(LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER).firstOrNull {
          try {
            manager.isProviderEnabled(it)
          } catch (e: Exception) {
            false
          }
        }
    if (provider == null) {
      settle(lastKnown)
      return
    }
    mainHandler.postDelayed({ settle(lastKnown) }, FIX_TIMEOUT_MS)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        manager.getCurrentLocation(provider, null, reactContext.mainExecutor) { location ->
          settle(location ?: lastKnown)
        }
      } else {
        val listener =
            object : LocationListener {
              override fun onLocationChanged(location: Location) {
                settle(location)
              }

              @Deprecated("Deprecated in Java")
              override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}

              override fun onProviderEnabled(provider: String) {}

              override fun onProviderDisabled(provider: String) {}
            }
        @Suppress("DEPRECATION")
        manager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
      }
    } catch (e: SecurityException) {
      settle(lastKnown)
    }
  }

  private fun placeName(location: Location): String? {
    if (!Geocoder.isPresent()) {
      return null
    }
    return try {
      @Suppress("DEPRECATION")
      val address =
          Geocoder(reactContext, Locale.getDefault())
              .getFromLocation(location.latitude, location.longitude, 1)
              ?.firstOrNull()
      address?.locality ?: address?.subAdminArea ?: address?.adminArea
    } catch (e: Exception) {
      null
    }
  }

  private fun requestFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val request =
          focusRequest
              ?: AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                  .setAudioAttributes(alarmAttributes)
                  .build()
                  .also { focusRequest = it }
      audioManager.requestAudioFocus(request)
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(
          null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
    }
  }

  private fun abandonFocus() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
    } else {
      @Suppress("DEPRECATION") audioManager.abandonAudioFocus(null)
    }
  }

  override fun invalidate() {
    mainHandler.removeCallbacks(releaseFocus)
    abandonFocus()
    soundPool.release()
    super.invalidate()
  }

  companion object {
    const val NAME = "RaveLiteDevice"
    private const val INTERRUPTION_FILTER_ALL = 1
    /** Longest cue is ~1.2 s; hold ducking a little past it. */
    private const val FOCUS_HOLD_MS = 1500L
    /** A last-known fix younger than this is good enough for the weather. */
    private const val LAST_FIX_MAX_AGE_MS = 24L * 60 * 60 * 1000
    private const val FIX_TIMEOUT_MS = 20_000L
  }
}
