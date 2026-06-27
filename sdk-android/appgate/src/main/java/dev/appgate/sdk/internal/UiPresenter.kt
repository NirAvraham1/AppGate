package dev.appgate.sdk.internal

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.appcompat.app.AlertDialog
import com.google.android.material.snackbar.Snackbar
import dev.appgate.sdk.AppGate
import dev.appgate.sdk.GateStatus

/**
 * Built-in screens: full maintenance screen, blocking update dialog,
 * soft update banner. Zero-design for the developer; replaceable via
 * setCustomScreen().
 */
internal object UiPresenter {

    fun present(activity: Activity, status: GateStatus, d: Directive?, customLayout: Int?) {
        // Custom UI? hand control to the listener instead of presenting.
        AppGate.listener?.let { l ->
            when (status) {
                GateStatus.MAINTENANCE -> l.onMaintenance(
                    d?.maintenance?.title ?: "", d?.maintenance?.message ?: "", d?.maintenance?.returnAt)
                GateStatus.FORCE_UPDATE -> l.onUpdateRequired(true, d?.versionPolicy?.url)
                GateStatus.SOFT_UPDATE -> l.onUpdateRequired(false, d?.versionPolicy?.url)
                GateStatus.NORMAL -> l.onNormal()
            }
            return
        }

        when (status) {
            GateStatus.MAINTENANCE -> {
                val intent = Intent(activity, MaintenanceActivity::class.java).apply {
                    putExtra("title", d?.maintenance?.title)
                    putExtra("message", d?.maintenance?.message)
                    putExtra("returnAt", d?.maintenance?.returnAt)
                    customLayout?.let { putExtra("customLayout", it) }
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                activity.startActivity(intent)
            }
            GateStatus.FORCE_UPDATE -> {
                // Mandatory update: blocking dialog + Intent to the store page.
                AlertDialog.Builder(activity)
                    .setTitle("נדרש עדכון")
                    .setMessage("הגרסה שלך אינה נתמכת עוד")
                    .setCancelable(false)
                    .setPositiveButton("עדכן עכשיו") { _, _ -> openStore(activity, d?.versionPolicy?.url) }
                    .show()
            }
            GateStatus.SOFT_UPDATE -> {
                Snackbar.make(activity.findViewById(android.R.id.content),
                    "🎁 גרסה חדשה זמינה", Snackbar.LENGTH_LONG)
                    .setAction("עדכן") { openStore(activity, d?.versionPolicy?.url) }
                    .show()
            }
            GateStatus.NORMAL -> { /* nothing to do */ }
        }
    }

    private fun openStore(activity: Activity, url: String?) {
        val target = url ?: "https://play.google.com/store/apps/details?id=${activity.packageName}"
        activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(target)))
    }
}
