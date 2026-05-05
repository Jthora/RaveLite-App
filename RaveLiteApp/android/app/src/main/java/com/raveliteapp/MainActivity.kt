package com.raveliteapp

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "RaveLiteApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Keep the screen on while RaveLite is in the foreground.
   *
   * Rationale: this is a training-companion app. The operator is mid-drill,
   * mid-flow, or watching a posture-cue countdown — the device must not
   * dim or sleep. The flag only applies while the activity is visible; the
   * OS resumes normal sleep behavior the moment the user backgrounds the
   * app, so battery cost is bounded to active sessions.
   *
   * Future: expose as a per-screen setting via Heart so the user can
   * disable this for desk-only use, but on by default.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    super.onCreate(savedInstanceState)
  }
}
