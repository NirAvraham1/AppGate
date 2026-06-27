package dev.appgate.sdk.internal

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Bundle
import androidx.work.*
import dev.appgate.sdk.AppGate
import java.util.concurrent.TimeUnit

/**
 * The central mechanism: refresh on every onResume — the moment the user
 * is in front of the screen. WorkManager (min 15 minutes, deferred by Doze)
 * is only a background safety net, never the main path.
 */
internal object RefreshScheduler {

    fun install(app: Application) {
        app.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
            override fun onActivityResumed(activity: Activity) = AppGate.refreshAsync()
            override fun onActivityCreated(a: Activity, b: Bundle?) {}
            override fun onActivityStarted(a: Activity) {}
            override fun onActivityPaused(a: Activity) {}
            override fun onActivityStopped(a: Activity) {}
            override fun onActivitySaveInstanceState(a: Activity, b: Bundle) {}
            override fun onActivityDestroyed(a: Activity) {}
        })

        val work = PeriodicWorkRequestBuilder<RefreshWorker>(30, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(app).enqueueUniquePeriodicWork(
            "appgate_refresh", ExistingPeriodicWorkPolicy.KEEP, work)
    }

    class RefreshWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {
        override fun doWork(): Result {
            AppGate.refreshAsync()
            return Result.success()
        }
    }
}
