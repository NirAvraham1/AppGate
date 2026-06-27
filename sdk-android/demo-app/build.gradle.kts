plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.appgate.demo"
    compileSdk = 34
    defaultConfig {
        applicationId = "dev.appgate.demo"
        minSdk = 21
        targetSdk = 34
        versionCode = 230            // change to 150 to demo FORCE_UPDATE
        versionName = "2.3"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(project(":appgate"))
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
}
