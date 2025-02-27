# IO-Login-Google

Google Login Demo

# Modify android>app>build.gradle

    paste debug.keystore (or whichever keystore file is being using in android>app> folder)

    // print statements to ensure correct variables are being passed from .env file
    println "KEYSTORE_PATH: " + System.getenv("KEYSTORE_PATH")
    println "KEYSTORE_PASS: " + System.getenv("KEYSTORE_PASS")
    println "KEY_ALIAS: " + System.getenv("KEY_ALIAS")
    println "KEY_PASS: " + System.getenv("KEY_PASS")

    // signingConfigs to use .env variable.
    signingConfigs {
        debug {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "$rootDir/../.android/debug.keystore")
            storePassword System.getenv("KEYSTORE_PASS") ?: "android"
            keyAlias System.getenv("KEY_ALIAS") ?: "androiddebugkey"
            keyPassword System.getenv("KEY_PASS") ?: "android"
        }
    }

    // ALTERNATIVELY.  This was the original signingConfig.
    // signingConfigs {
    //     debug {
    //         storeFile file('debug.keystore')
    //         storePassword 'android'
    //         keyAlias 'androiddebugkey'
    //         keyPassword 'android'
    //     }
    // }
