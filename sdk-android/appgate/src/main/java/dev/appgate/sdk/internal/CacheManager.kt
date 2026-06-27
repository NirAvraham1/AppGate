package dev.appgate.sdk.internal

import android.content.Context
import java.util.UUID

/**
 * Stores the directive + ETag in SharedPreferences.
 * On launch: render by cache, refresh in background (stale-while-revalidate).
 */
internal class CacheManager(context: Context) {
    private val prefs = context.getSharedPreferences("appgate_sdk", Context.MODE_PRIVATE)

    fun save(d: Directive) {
        prefs.edit().putString("directive", d.raw).putString("etag", d.etag).apply()
    }

    fun load(): Directive? =
        prefs.getString("directive", null)?.let { runCatching { Directive.parse(it) }.getOrNull() }

    fun etag(): String? = prefs.getString("etag", null)

    /** Anonymous deviceId: a UUID created at install time, sent as-is (no PII). */
    fun deviceHash(): String {
        var id = prefs.getString("device_id", null)
        if (id == null) {
            id = UUID.randomUUID().toString().replace("-", "").take(32)
            prefs.edit().putString("device_id", id).apply()
        }
        return id
    }
}
