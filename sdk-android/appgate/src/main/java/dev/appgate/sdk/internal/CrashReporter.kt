package dev.appgate.sdk.internal

import android.content.Context
import dev.appgate.sdk.AppGate
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Crash sniffer.
 *
 * The problem: a raw Android crash is a huge, noisy stack trace that a
 * developer has to read line by line just to understand "what broke".
 *
 * What this does: it catches every uncaught exception, distills it into a
 * small, readable JSON ("a clear sentence instead of a giant log"), saves it
 * locally first (so it survives the crash), and ships it to the server on the
 * next launch. The original default handler is still called afterwards, so the
 * app crashes normally — we only observe, we never swallow.
 */
internal class CrashReporter(
    private val context: Context,
    private val apiKey: String,
    private val baseUrl: String,
) {
    private val prefs = context.getSharedPreferences("appgate_crash", Context.MODE_PRIVATE)

    fun install() {
        val previous = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            runCatching { capture(thread, throwable) }
            // never swallow: hand control back to the original handler
            previous?.uncaughtException(thread, throwable)
        }
        // anything captured in a previous run, but not yet sent, goes now —
        // on a background thread (network is never allowed on the main thread).
        Thread { runCatching { flush() } }.start()
    }

    /** Turn a scary stack trace into one small, human-readable JSON object. */
    private fun capture(thread: Thread, throwable: Throwable) {
        // the deepest cause is usually the real reason
        var root: Throwable = throwable
        while (root.cause != null && root.cause !== root) root = root.cause!!

        // the first stack frame inside the app's own package — where it actually broke
        val appFrame = root.stackTrace.firstOrNull {
            it.className.startsWith(context.packageName)
        } ?: root.stackTrace.firstOrNull()

        val versionCode = try {
            val info = context.packageManager.getPackageInfo(context.packageName, 0)
            if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode
            else @Suppress("DEPRECATION") info.versionCode.toLong()
        } catch (e: Exception) { 0L }

        val summary = JSONObject().apply {
            put("deviceHash", AppGate.cache.deviceHash())
            put("exception", root.javaClass.simpleName)          // e.g. NullPointerException
            put("message", root.message ?: "")                   // the short reason
            put("location", appFrame?.let { "${it.className.substringAfterLast('.')}.${it.methodName}:${it.lineNumber}" } ?: "unknown")
            put("thread", thread.name)
            put("versionCode", versionCode)
            put("sdkInt", android.os.Build.VERSION.SDK_INT)
            put("device", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            put("timestamp", System.currentTimeMillis())
        }

        // persist immediately — the process is about to die
        prefs.edit().putString("pending", summary.toString()).commit()
    }

    @Synchronized private fun flush() {
        val pending = prefs.getString("pending", null) ?: return
        if (send(pending)) prefs.edit().remove("pending").apply()
    }

    private fun send(body: String): Boolean = try {
        val conn = URL("$baseUrl/v1/crashes").openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 3000
        conn.readTimeout = 3000
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("X-Api-Key", apiKey)
        conn.outputStream.use { it.write(body.toByteArray()) }
        conn.responseCode in 200..299
    } catch (e: Exception) { false }
}
