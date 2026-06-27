package dev.appgate.sdk

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import dev.appgate.sdk.internal.*
import java.util.concurrent.Executors

/**
 * AppGate — maintenance mode, version enforcement & kill switch.
 *
 * Two usage levels:
 *  - Auto mode (one line): AppGate.attachTo(activity) — the SDK shows the
 *    built-in maintenance screen / update dialog by itself.
 *  - Advanced: setListener(...) for custom UI.
 *
 * Zero waiting: synchronous calls (isFeatureEnabled, getFeatureMessage)
 * answer from the local cache and never block the UI thread.
 */
object AppGate {

    @Volatile internal var directive: Directive? = null
    internal lateinit var cache: CacheManager
    internal lateinit var fetcher: DirectiveFetcher
    internal lateinit var evaluator: DirectiveEvaluator
    internal lateinit var telemetry: TelemetryReporter
    internal lateinit var crashReporter: CrashReporter
    internal var listener: GateListener? = null
    internal var customScreenLayout: Int? = null
    internal val executor = Executors.newSingleThreadExecutor()
    internal val mainHandler = Handler(Looper.getMainLooper())
    private var initialized = false

    /**
     * Initialize in Application.onCreate():
     * loads the last directive from cache and schedules refreshes.
     */
    @JvmStatic
    fun init(context: Context, apiKey: String, baseUrl: String = "https://api.appgate.dev") {
        if (initialized) return
        initialized = true
        val app = context.applicationContext as Application

        cache = CacheManager(app)
        evaluator = DirectiveEvaluator(app)
        fetcher = DirectiveFetcher(app, apiKey, baseUrl)
        telemetry = TelemetryReporter(app, apiKey, baseUrl)

        // Crash sniffer: catch uncaught exceptions, ship a small readable
        // JSON summary instead of a giant stack trace. Sends any crash
        // captured in a previous run on startup.
        crashReporter = CrashReporter(app, apiKey, baseUrl)
        crashReporter.install()

        // Stale-while-revalidate: show by cache immediately, refresh in background.
        directive = cache.load()
        refreshAsync()

        // The critical moment is when the user is in front of the screen:
        // refresh on every onResume. WorkManager is only a background safety net.
        RefreshScheduler.install(app)
    }

    /** Check against the server; callback receives the evaluated status. */
    @JvmStatic
    fun checkStatus(callback: (GateStatus) -> Unit) {
        executor.execute {
            val fresh = fetcher.fetch(cache.etag())
            if (fresh != null) { directive = fresh; cache.save(fresh) }
            val status = evaluator.evaluate(directive)
            telemetry.report(status)
            mainHandler.post { callback(status) }
        }
    }

    /**
     * Auto mode — the SDK presents the maintenance screen / update dialog itself.
     * Optional [onStatus] callback lets the host app update its own UI
     * (status chip, feature sections) after every evaluation.
     */
    @JvmStatic
    @JvmOverloads
    fun attachTo(activity: Activity, onStatus: ((GateStatus) -> Unit)? = null) {
        checkStatus { status ->
            UiPresenter.present(activity, status, directive, customScreenLayout)
            onStatus?.invoke(status)
        }
    }

    /** Report that the user hit a disabled feature (for the portal analytics). */
    @JvmStatic
    fun reportFeatureBlocked(key: String) {
        executor.execute { telemetry.reportFeatureBlocked() }
    }

    /** Kill-switch check — instant answer from cache, no network. */
    @JvmStatic
    fun isFeatureEnabled(key: String): Boolean =
        directive?.features?.get(key)?.enabled ?: true   // fail-open: unknown feature stays on

    /** The alternative message to show when the feature is off. */
    @JvmStatic
    fun getFeatureMessage(key: String): String =
        directive?.features?.get(key)?.msg ?: ""

    /** Custom-UI callbacks: onMaintenance, onUpdateRequired... */
    @JvmStatic
    fun setListener(l: GateListener) { listener = l }

    /** Replace the built-in maintenance screen with the developer's own layout. */
    @JvmStatic
    fun setCustomScreen(layoutRes: Int) { customScreenLayout = layoutRes }

    // ---- internal ----
    internal fun refreshAsync() {
        executor.execute {
            val fresh = fetcher.fetch(cache.etag()) ?: return@execute
            directive = fresh
            cache.save(fresh)
            listener?.let { l -> mainHandler.post { l.onDirectiveChanged(fresh) } }
        }
    }
}
