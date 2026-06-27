package dev.appgate.demo

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import dev.appgate.sdk.AppGate
import dev.appgate.sdk.GateStatus

/**
 * MyShopApp — the demo store.
 * Everything in the portal is reflected here live:
 *  - "הפעל מצב תחזוקה"          -> full maintenance screen (blocking)
 *  - minVersion > versionCode    -> blocking update dialog
 *  - softMin > versionCode       -> dismissible update banner
 *  - kill switch "payments"      -> pay button replaced by alternative message
 *  - kill switch "chat"          -> chat button replaced by alternative message
 */
class MainActivity : AppCompatActivity() {

    private data class Product(val name: String, val price: Int)
    private val products = listOf(
        Product("🎧 אוזניות אלחוטיות", 199),
        Product("⌚ שעון חכם", 449),
        Product("🔋 מטען נייד", 89),
        Product("📱 כיסוי מגן", 39),
    )
    private var cartCount = 0
    private var cartTotal = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // show which version this build pretends to be — useful when demoing version enforcement
        val info = packageManager.getPackageInfo(packageName, 0)
        val code = if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode
                   else @Suppress("DEPRECATION") info.versionCode.toLong()
        findViewById<TextView>(R.id.txt_version).text =
            "גרסה ${info.versionName} · versionCode $code"

        buildProductCards()

        findViewById<Button>(R.id.btn_pay).setOnClickListener { onPayClicked() }
        findViewById<Button>(R.id.btn_chat).setOnClickListener { onChatClicked() }

        findViewById<Button>(R.id.btn_chat).setOnLongClickListener {
            throw RuntimeException("דמו: קריסה מכוונת להדגמת ה-Crash Sniffer")
        }
    }

    override fun onResume() {
        super.onResume()
        // The SDK's main refresh moment: every return to foreground.
        // attachTo presents maintenance/update UI itself, then hands us
        // the status so we can update our own UI (chip + feature sections).
        AppGate.attachTo(this) { status -> render(status) }
    }

    // ---------- features (kill switches) ----------

    private fun onPayClicked() {
        if (AppGate.isFeatureEnabled("payments")) {
            Toast.makeText(this, "פותח מסך תשלום… (₪$cartTotal)", Toast.LENGTH_SHORT).show()
        } else {
            // The check is instant, from cache — but report the hit for analytics.
            AppGate.reportFeatureBlocked("payments")
            Toast.makeText(this, AppGate.getFeatureMessage("payments"), Toast.LENGTH_LONG).show()
        }
    }

    private fun onChatClicked() {
        if (AppGate.isFeatureEnabled("chat")) {
            Toast.makeText(this, "פותח צ'אט עם נציג…", Toast.LENGTH_SHORT).show()
        } else {
            AppGate.reportFeatureBlocked("chat")
            Toast.makeText(this, AppGate.getFeatureMessage("chat"), Toast.LENGTH_LONG).show()
        }
    }

    /** Re-render the screen according to the current directive. */
    private fun render(status: GateStatus) {
        // status chip
        findViewById<TextView>(R.id.chip_status).apply {
            text = when (status) {
                GateStatus.NORMAL -> "● NORMAL"
                GateStatus.MAINTENANCE -> "● MAINTENANCE"
                GateStatus.FORCE_UPDATE -> "● FORCE_UPDATE"
                GateStatus.SOFT_UPDATE -> "● SOFT_UPDATE"
            }
            setTextColor(when (status) {
                GateStatus.NORMAL -> Color.parseColor("#1C7A55")
                GateStatus.SOFT_UPDATE -> Color.parseColor("#9A7B1E")
                else -> Color.parseColor("#C0392B")
            })
        }

        // payments kill switch: hide the pay button, show the alternative message
        val paymentsOn = AppGate.isFeatureEnabled("payments")
        findViewById<Button>(R.id.btn_pay).isEnabled = paymentsOn
        findViewById<TextView>(R.id.txt_payments_disabled).apply {
            visibility = if (paymentsOn) android.view.View.GONE else android.view.View.VISIBLE
            if (!paymentsOn) text = "💳🔒 " + AppGate.getFeatureMessage("payments")
                .ifBlank { "התשלומים אינם זמינים כרגע" }
        }

        // chat kill switch
        val chatOn = AppGate.isFeatureEnabled("chat")
        findViewById<Button>(R.id.btn_chat).visibility =
            if (chatOn) android.view.View.VISIBLE else android.view.View.GONE
        findViewById<TextView>(R.id.txt_chat_disabled).apply {
            visibility = if (chatOn) android.view.View.GONE else android.view.View.VISIBLE
            if (!chatOn) text = "💬 " + AppGate.getFeatureMessage("chat")
                .ifBlank { "הצ'אט אינו זמין כרגע" }
        }
    }

    // ---------- tiny static "shop" ----------

    private fun buildProductCards() {
        val container = findViewById<LinearLayout>(R.id.products_container)
        products.forEach { p ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setBackgroundColor(Color.WHITE)
                elevation = 2f
                setPadding(36, 36, 36, 36)
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ).apply { bottomMargin = 24 }
            }
            card.addView(TextView(this).apply {
                text = "${p.name}\n₪${p.price}"
                textSize = 15f
                setTextColor(Color.parseColor("#1B2030"))
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            })
            card.addView(Button(this).apply {
                text = "הוסף לסל"
                setOnClickListener {
                    cartCount++; cartTotal += p.price
                    findViewById<Button>(R.id.btn_pay)?.text = "💳 לתשלום ($cartCount)"
                    findViewById<TextView>(R.id.txt_total)?.text = "סה״כ: ₪$cartTotal"
                }
            })
            container.addView(card)
        }
    }
}
