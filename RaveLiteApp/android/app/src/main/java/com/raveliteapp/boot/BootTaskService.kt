package com.raveliteapp.boot

import android.content.Intent
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Runs `RaveLiteBoot` (registered in index.js) without an activity. The
 * task starts the foreground service, whose own long-lived task keeps the
 * JS runtime — and every chime — going after this one finishes.
 */
class BootTaskService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig =
      HeadlessJsTaskConfig(
          TASK,
          Arguments.createMap(),
          TIMEOUT_MS,
          // The phone may already be unlocked and RaveLite on screen.
          true,
      )

  companion object {
    const val TASK = "RaveLiteBoot"
    private const val TIMEOUT_MS = 60_000L
  }
}
