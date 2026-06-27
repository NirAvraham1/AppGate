package dev.appgate.demo

import android.app.Application
import dev.appgate.sdk.AppGate

class DemoApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Full integration — one line in Application.onCreate().
        // 10.0.2.2 = host machine when running in the Android emulator.
        AppGate.init(this, apiKey = "ag_live_demo_key_12345", baseUrl = "http://10.0.2.2:4000")
    }
}
