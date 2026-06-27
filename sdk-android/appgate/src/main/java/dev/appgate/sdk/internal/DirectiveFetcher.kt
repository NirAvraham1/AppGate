package dev.appgate.sdk.internal

import android.content.Context
import android.content.pm.PackageManager
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

/**
 * GET /v1/directive with projectId (via API key), versionCode and locale.
 * Sends If-None-Match (ETag) — unchanged directive returns an empty 304.
 * 3 second timeout — we never delay app startup.
 */
internal class DirectiveFetcher(
    private val context: Context,
    private val apiKey: String,
    private val baseUrl: String,
) {
    fun versionCode(): Long = try {
        val info = context.packageManager.getPackageInfo(context.packageName, 0)
        if (android.os.Build.VERSION.SDK_INT >= 28) info.longVersionCode
        else @Suppress("DEPRECATION") info.versionCode.toLong()
    } catch (e: PackageManager.NameNotFoundException) { 0L }

    /** Returns a new Directive, or null on 304 / network failure (fail-safe: keep last cache). */
    fun fetch(etag: String?): Directive? {
        return try {
            val url = URL("$baseUrl/v1/directive?versionCode=${versionCode()}&platform=android&locale=${Locale.getDefault().language}")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            conn.setRequestProperty("X-Api-Key", apiKey)
            etag?.let { conn.setRequestProperty("If-None-Match", it) }

            when (conn.responseCode) {
                304 -> null // nothing changed — keep cache
                200 -> Directive.parse(conn.inputStream.bufferedReader().readText())
                else -> null
            }
        } catch (e: Exception) {
            // No network? Continue by the last cached directive.
            // The SDK protects the product — it never crashes the host app.
            null
        }
    }
}
