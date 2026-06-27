package dev.appgate.sdk.internal

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import dev.appgate.sdk.AppGate
import dev.appgate.sdk.GateStatus
import dev.appgate.sdk.R

/** The built-in full-screen maintenance screen. */
internal class MaintenanceActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val custom = intent.getIntExtra("customLayout", 0)
        setContentView(if (custom != 0) custom else R.layout.appgate_maintenance)

        findViewById<TextView?>(R.id.appgate_title)?.text =
            intent.getStringExtra("title") ?: getString(R.string.appgate_default_title)
        findViewById<TextView?>(R.id.appgate_message)?.text =
            intent.getStringExtra("message") ?: getString(R.string.appgate_default_message)
        val returnAt = intent.getStringExtra("returnAt")
        findViewById<TextView?>(R.id.appgate_return)?.apply {
            if (returnAt.isNullOrBlank()) visibility = android.view.View.GONE
            else text = getString(R.string.appgate_return_at, returnAt)
        }
        findViewById<Button?>(R.id.appgate_retry)?.setOnClickListener {
            // "Try again": re-check; if back to NORMAL, close the screen.
            AppGate.checkStatus { status -> if (status != GateStatus.MAINTENANCE) finish() }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() { /* maintenance screen blocks back navigation */ }
}
