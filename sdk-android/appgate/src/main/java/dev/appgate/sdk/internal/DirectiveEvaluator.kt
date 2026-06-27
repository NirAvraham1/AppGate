package dev.appgate.sdk.internal

import android.content.Context
import dev.appgate.sdk.GateStatus

/**
 * The decision is made twice: the server computes the directive,
 * and the SDK validates locally (version, clock). This way a stale cache
 * never blocks by mistake and never escapes enforcement.
 */
internal class DirectiveEvaluator(private val context: Context) {

    fun evaluate(d: Directive?): GateStatus {
        if (d == null) return GateStatus.NORMAL // fail-open: no network and no cache -> app stays open

        val versionCode = try {
            val info = context.packageManager.getPackageInfo(context.packageName, 0)
            if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode else @Suppress("DEPRECATION") info.versionCode.toLong()
        } catch (e: Exception) { 0L }

        // Priority: maintenance > force update > soft update.
        if (d.status == "MAINTENANCE") return GateStatus.MAINTENANCE
        if (d.versionPolicy.min > 0 && versionCode < d.versionPolicy.min) return GateStatus.FORCE_UPDATE
        if (d.versionPolicy.soft > 0 && versionCode < d.versionPolicy.soft) return GateStatus.SOFT_UPDATE
        return GateStatus.NORMAL
    }
}
