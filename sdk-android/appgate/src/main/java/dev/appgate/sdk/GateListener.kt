package dev.appgate.sdk

import dev.appgate.sdk.internal.Directive

/** Callbacks for apps that want custom UI instead of the built-in screens. */
interface GateListener {
    fun onMaintenance(title: String, message: String, returnAt: String?) {}
    fun onUpdateRequired(force: Boolean, storeUrl: String?) {}
    fun onNormal() {}
    fun onDirectiveChanged(directive: Directive) {}
}
