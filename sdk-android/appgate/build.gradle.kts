plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.appgate.sdk"
    compileSdk = 34
    defaultConfig { minSdk = 21 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("com.google.android.material:material:1.11.0") // built-in banner // background safety-net refresh
}
