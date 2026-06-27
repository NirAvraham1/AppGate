package dev.appgate.sdk.internal

import android.content.Context
import dev.appgate.sdk.AppGate
import dev.appgate.sdk.GateStatus
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal telemetry: one event per status check (version + what was shown).
 * Events are written to a local queue first — if the app is killed or
 * offline, they are sent on the next launch.
 */
internal class TelemetryReporter(
    context: Context,
    private val apiKey: String,
    private val baseUrl: String,
) {
    private val prefs = context.getSharedPreferences("appgate_telemetry", Context.MODE_PRIVATE)

    fun report(status: GateStatus) {
        val eventType = when (status) {
            GateStatus.MAINTENANCE -> "MAINTENANCE_SHOWN"
            GateStatus.FORCE_UPDATE, GateStatus.SOFT_UPDATE -> "UPDATE_SHOWN"
            GateStatus.NORMAL -> "STATUS_CHECK"
        }
        enqueue(eventType)
        flush()
    }

    fun reportFeatureBlocked() { enqueue("FEATURE_BLOCKED"); flush() }

    @Synchronized private fun enqueue(eventType: String) {
        val queue = JSONArray(prefs.getString("queue", "[]"))
        queue.put(JSONObject()
            .put("deviceHash", AppGate.cache.deviceHash())
            .put("eventType", eventType)
            .put("versionCode", AppGate.fetcher.versionCode())
            .put("timestamp", System.currentTimeMillis()))
        prefs.edit().putString("queue", queue.toString()).apply()
    }

    @Synchronized private fun flush() {
        val queue = JSONArray(prefs.getString("queue", "[]"))
        if (queue.length() == 0) return
        val remaining = JSONArray()
        for (i in 0 until queue.length()) {
            val event = queue.getJSONObject(i)
            if (!send(event)) remaining.put(event) // keep for next launch
        }
        prefs.edit().putString("queue", remaining.toString()).apply()
    }

    private fun send(event: JSONObject): Boolean = try {
        val conn = URL("$baseUrl/v1/events").openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 3000
        conn.readTimeout = 3000
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("X-Api-Key", apiKey)
        conn.outputStream.use { it.write(event.toString().toByteArray()) }
        conn.responseCode in 200..299
    } catch (e: Exception) { false }
}
