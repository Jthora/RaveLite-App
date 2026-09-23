package com.raveliteapp.device

import android.Manifest
import android.app.Activity
import android.app.ActivityManager
import android.app.usage.UsageStatsManager
import android.content.ClipData
import android.content.ClipboardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
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
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.core.content.FileProvider
import com.raveliteapp.R
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/**
 * RaveLite device bridge — the native capabilities JS can't reach.
 *
 *  - Element cue playback on the ALARM audio stream (SoundPool), so chimes
 *    sound even when the ringer is silent, notification volume is 0, or Do
 *    Not Disturb lets alarms through. Other audio (e.g. TikTok) ducks for
 *    the length of the cue.
 *  - Alarm volume, the ringer mode and the current DND interruption
 *    filter, for the Chimes settings and the "Follow silent mode and Do
 *    Not Disturb" switch.
 *  - Window backlight override for night mode: the screen stays on
 *    (FLAG_KEEP_SCREEN_ON) but barely lit outside active hours.
 *  - A rough location, once, for sunrise and the forecast.
 *  - Writing an export out and reading one back, through the system file
 *    picker, so a year of training can leave the phone and come back.
 *
 * Old-architecture module (newArchEnabled=false), registered manually in
 * MainApplication via [RaveLiteDevicePackage].
 */
class RaveLiteDeviceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener, LifecycleEventListener {

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

  /** The file picker in flight, and the text a save is waiting to write. */
  private val pendingPicker = AtomicReference<Promise?>(null)
  private val pendingText = AtomicReference<String?>(null)

  init {
    soundPool.setOnLoadCompleteListener { _, sampleId, status ->
      if (status == 0) {
        synchronized(loadedSamples) { loadedSamples.add(sampleId) }
      }
    }
    for ((element, res) in cueResources) {
      sampleIds[element] = soundPool.load(reactContext, res, 1)
    }
    reactContext.addActivityEventListener(this)
    reactContext.addLifecycleEventListener(this)
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

  /**
   * The phone's locale, as a BCP-47 tag ("en-US", "en-GB"). Used once, to
   * guess whether somebody thinks in miles or kilometres — the app asks
   * nobody a units question it can answer itself.
   */
  @ReactMethod
  fun getLocale(promise: Promise) {
    val locale = Locale.getDefault()
    val result = Arguments.createMap()
    result.putString("language", locale.language)
    result.putString("country", locale.country)
    promise.resolve(result)
  }

  /**
   * What phone this is, for a bug report. A beta is spread across phones
   * that behave differently, and a report that does not name the phone
   * is a guess. Nothing here identifies a person: make, model, OS, the
   * maker's own skin version, and how tight the device is.
   */
  @ReactMethod
  fun getDeviceInfo(promise: Promise) {
    val result = Arguments.createMap()
    result.putString("manufacturer", Build.MANUFACTURER)
    result.putString("brand", Build.BRAND)
    result.putString("model", Build.MODEL)
    result.putString("release", Build.VERSION.RELEASE)
    result.putInt("sdk", Build.VERSION.SDK_INT)
    result.putString("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown")
    result.putBoolean("is64Bit", Build.SUPPORTED_64_BIT_ABIS.isNotEmpty())
    // The maker's own version, where the maker publishes one. Each of
    // these is a system property that only that maker sets.
    result.putString(
        "skin",
        listOf(
                "ro.miui.ui.version.name" to "MIUI/HyperOS",
                "ro.build.version.oneui" to "One UI",
                "ro.build.version.emui" to "EMUI",
                "ro.build.version.opporom" to "ColorOS",
                "ro.vivo.os.version" to "Funtouch/OriginOS",
                "ro.build.version.realmeui" to "realme UI",
                "ro.hos.version" to "HiOS",
            )
            .firstNotNullOfOrNull { (prop, name) ->
              systemProperty(prop)?.takeIf { it.isNotBlank() }?.let { "$name $it" }
            }
            ?: "")
    val activityManager =
        reactContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    result.putBoolean("lowRam", activityManager?.isLowRamDevice ?: false)
    // The standby bucket decides whether alarms fire at all, and
    // "restricted" also means no start after a reboot.
    result.putInt(
        "standbyBucket",
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          (reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager)
              ?.appStandbyBucket
              ?: 0
        } else 0)
    result.putBoolean(
        "backgroundRestricted",
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          activityManager?.isBackgroundRestricted ?: false
        } else false)
    promise.resolve(result)
  }

  /**
   * Put text on the clipboard. For the status report, which is the one
   * thing a person is asked to paste into a bug report.
   */
  @ReactMethod
  fun copyText(text: String, promise: Promise) {
    try {
      val clipboard =
          reactContext.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
      clipboard.setPrimaryClip(ClipData.newPlainText("RaveLite", text))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /** A system property, or null. Only the maker's own skin version is read. */
  private fun systemProperty(name: String): String? =
      try {
        @Suppress("PrivateApi")
        val get =
            Class.forName("android.os.SystemProperties")
                .getMethod("get", String::class.java)
        (get.invoke(null, name) as? String)?.takeIf { it.isNotEmpty() }
      } catch (e: Exception) {
        null
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

  /** Resolves AudioManager.RINGER_MODE_* (0 silent, 1 vibrate, 2 normal). */
  @ReactMethod
  fun getRingerMode(promise: Promise) {
    promise.resolve(audioManager.ringerMode)
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
   * Whether the phone's location switch is on at all. A granted permission
   * still gives nothing while this is off, and "turn location on" is very
   * different advice from "type a town instead".
   */
  @ReactMethod
  fun isLocationEnabled(promise: Promise) {
    val manager = reactContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val on =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) manager.isLocationEnabled
        else
            manager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    promise.resolve(on)
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

  /**
   * Write [text] out through the system file picker, suggesting [filename].
   * Resolves the name the file was saved as, or null if the picker was
   * dismissed. The picker is used rather than a fixed Downloads path so the
   * backup can land somewhere that outlives the phone — Drive, an SD card —
   * and so no storage permission is ever needed.
   */
  @ReactMethod
  fun saveExport(filename: String, text: String, promise: Promise) {
    val intent =
        Intent(Intent.ACTION_CREATE_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType(JSON_MIME)
            .putExtra(Intent.EXTRA_TITLE, filename)
    pendingText.set(text)
    startPicker(intent, SAVE_REQUEST, promise)
  }

  /**
   * Read a chosen file back as text. Resolves null if the picker was
   * dismissed, and rejects only if the file could not be read at all.
   */
  @ReactMethod
  fun readExport(promise: Promise) {
    val intent =
        Intent(Intent.ACTION_OPEN_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE)
            .setType("*/*")
            .putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(JSON_MIME, "text/plain"))
    startPicker(intent, OPEN_REQUEST, promise)
  }

  /**
   * Relaunch the app from scratch. A restore replaces every stored key
   * underneath a running app whose screens, caches and scheduled chimes
   * were all built from the old data; starting the process again is the
   * only way to be certain nothing stale survives.
   */
  @ReactMethod
  fun restartApp(promise: Promise) {
    val intent =
        reactContext.packageManager.getLaunchIntentForPackage(reactContext.packageName)
    if (intent == null) {
      promise.resolve(false)
      return
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    promise.resolve(true)
    // Let the bridge deliver that answer before the process goes.
    mainHandler.postDelayed(
        {
          reactContext.startActivity(intent)
          Runtime.getRuntime().exit(0)
        },
        RESTART_DELAY_MS)
  }

  /**
   * Hand an export to another app — mail, chat, a bug tracker.
   *
   * A tester who finds something wrong has the whole of their state in
   * one file and, until now, no way to send it. The file is written to
   * cache/shared, which the FileProvider exposes and nothing else does,
   * and the share sheet gets read permission for that one URI.
   */
  @ReactMethod
  fun shareExport(filename: String, text: String, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    try {
      val dir = File(reactContext.cacheDir, "shared")
      dir.mkdirs()
      // Only ever one: a folder of old exports is a folder of old
      // training logs nobody meant to keep.
      dir.listFiles()?.forEach { it.delete() }
      val file = File(dir, filename)
      file.writeText(text, Charsets.UTF_8)

      val uri =
          FileProvider.getUriForFile(
              reactContext, "${reactContext.packageName}.fileprovider", file)
      val send =
          Intent(Intent.ACTION_SEND)
              .setType(JSON_MIME)
              .putExtra(Intent.EXTRA_STREAM, uri)
              .putExtra(Intent.EXTRA_SUBJECT, filename)
              .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      activity.startActivity(Intent.createChooser(send, "Send your RaveLite data"))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("share_failed", e.message ?: "Could not share that.", e)
    }
  }

  /** One picker at a time: a second ask cancels the first rather than leaking it. */
  private fun startPicker(intent: Intent, requestCode: Int, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      pendingText.set(null)
      promise.resolve(null)
      return
    }
    pendingPicker.getAndSet(promise)?.resolve(null)
    try {
      activity.startActivityForResult(intent, requestCode)
    } catch (e: Exception) {
      pendingText.set(null)
      pendingPicker.set(null)
      promise.reject("no_picker", "This phone has no file picker.", e)
    }
  }

  override fun onActivityResult(
      activity: Activity?,
      requestCode: Int,
      resultCode: Int,
      data: Intent?
  ) {
    if (requestCode != SAVE_REQUEST && requestCode != OPEN_REQUEST) {
      return
    }
    val promise = pendingPicker.getAndSet(null) ?: return
    val text = pendingText.getAndSet(null)
    val uri = data?.data
    if (resultCode != Activity.RESULT_OK || uri == null) {
      promise.resolve(null)
      return
    }
    // Both directions touch the filesystem: keep them off the UI thread.
    Thread {
          try {
            if (requestCode == SAVE_REQUEST) {
              reactContext.contentResolver.openOutputStream(uri)?.use {
                it.write((text ?: "").toByteArray(Charsets.UTF_8))
              } ?: throw IllegalStateException("could not open $uri for writing")
              promise.resolve(displayName(uri))
            } else {
              val read =
                  reactContext.contentResolver.openInputStream(uri)?.use { stream ->
                    stream.bufferedReader(Charsets.UTF_8).readText()
                  } ?: throw IllegalStateException("could not open $uri for reading")
              promise.resolve(read)
            }
          } catch (e: Exception) {
            promise.reject("file_failed", e.message ?: "The file could not be used.", e)
          }
        }
        .start()
  }

  override fun onNewIntent(intent: Intent?) {}

  /**
   * A file picker does not always come back with a result: on a low-memory
   * phone the system can tear the activity down behind it, and the chooser
   * then simply goes away. Android delivers onActivityResult before
   * onResume, so a picker promise still pending by the time we are in front
   * again is one that will never be answered — and a JS caller waiting on it
   * forever leaves its buttons dead. Answer it as a cancel.
   */
  override fun onHostResume() {
    pendingPicker.getAndSet(null)?.resolve(null)
    pendingText.set(null)
  }

  override fun onHostPause() {}

  override fun onHostDestroy() {
    onHostResume()
  }

  /** The name the picker gave the file, for the "saved as" line. */
  private fun displayName(uri: android.net.Uri): String {
    return try {
      reactContext.contentResolver
          .query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)
          ?.use { cursor -> if (cursor.moveToFirst()) cursor.getString(0) else null }
          ?: uri.lastPathSegment ?: "your file"
    } catch (e: Exception) {
      uri.lastPathSegment ?: "your file"
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
    reactContext.removeActivityEventListener(this)
    reactContext.removeLifecycleEventListener(this)
    pendingPicker.getAndSet(null)?.resolve(null)
    pendingText.set(null)
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
    private const val JSON_MIME = "application/json"
    private const val SAVE_REQUEST = 7301
    private const val OPEN_REQUEST = 7302
    private const val RESTART_DELAY_MS = 400L
  }
}
