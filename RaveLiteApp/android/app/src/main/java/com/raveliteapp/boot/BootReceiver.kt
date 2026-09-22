package com.raveliteapp.boot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.HeadlessJsTaskService

/**
 * After a reboot, or an update, nothing used to start RaveLite again until
 * somebody opened it — so chimes stopped, and only the OS backup
 * notifications were left. This starts the JS runtime in the background
 * (see [BootTaskService] and `bootTask` in index.js), which starts the
 * chime runtime and the foreground service exactly as opening the app does.
 *
 * BOOT_COMPLETED arrives after the first unlock on a phone with a PIN or
 * pattern: the app's data is encrypted until then.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action != Intent.ACTION_BOOT_COMPLETED &&
        action != Intent.ACTION_MY_PACKAGE_REPLACED) {
      return
    }
    try {
      context.startService(Intent(context, BootTaskService::class.java))
      HeadlessJsTaskService.acquireWakeLockNow(context)
    } catch (e: Exception) {
      // Some OEM builds refuse a background start even here. Nothing to
      // do but say so: opening the app starts everything anyway.
      Log.w(TAG, "could not start the boot task after $action", e)
    }
  }

  companion object {
    private const val TAG = "RaveLiteBoot"
  }
}
