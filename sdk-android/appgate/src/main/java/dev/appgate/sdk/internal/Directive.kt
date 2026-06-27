package dev.appgate.sdk.internal

import org.json.JSONObject

data class Feature(val enabled: Boolean, val msg: String)
data class MaintenanceInfo(val title: String, val message: String, val returnAt: String?)
data class VersionPolicy(val min: Int, val soft: Int, val url: String?)

/** One unified JSON answer that decides what is shown. */
data class Directive(
    val status: String,
    val etag: String,
    val maintenance: MaintenanceInfo?,
    val versionPolicy: VersionPolicy,
    val features: Map<String, Feature>,
    val raw: String,
) {
    companion object {
        fun parse(json: String): Directive {
            val o = JSONObject(json)
            val m = o.optJSONObject("maintenance")?.let {
                MaintenanceInfo(
                    it.optString("title", "Maintenance"),
                    it.optString("message", ""),
                    if (it.isNull("returnAt")) null else it.optString("returnAt"),
                )
            }
            val vp = o.optJSONObject("versionPolicy")
            val features = mutableMapOf<String, Feature>()
            o.optJSONObject("features")?.let { f ->
                for (key in f.keys()) {
                    val fo = f.getJSONObject(key)
                    features[key] = Feature(fo.optBoolean("enabled", true), fo.optString("msg", ""))
                }
            }
            return Directive(
                status = o.optString("status", "NORMAL"),
                etag = o.optString("etag", ""),
                maintenance = m,
                versionPolicy = VersionPolicy(
                    vp?.optInt("min", 0) ?: 0,
                    vp?.optInt("soft", 0) ?: 0,
                    vp?.let { if (it.isNull("url")) null else it.optString("url") },
                ),
                features = features,
                raw = json,
            )
        }
    }
}
