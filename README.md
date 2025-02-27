# IO-Login-Google

Google Login Demo

- Works in React Native on both iOS and Android
- Demonstrates Google Login - Demonstrates Google Maps
- Requires keystore file for proper Android deployment

Required Changes for Android Deployment

- Modify the following files:

0. .env

- activate Client Ids and Keystore variables for appropriate project
- check console log statements during build to confirm env variables are passed correctly

1. app.json (change only if not automatically changed by env file)

- change name (see env file for example)
- change slug (see env file for example)
- change bundle identifier
- change package
- change scheme
- change projectID (generated at expo build?)

2. AndroidManifest.xml

- change android:scheme settings (maybe up to 3 instances)

3. build.gradle (in android>apps)

- change namespace
- change applicationId
- ensure KEYSTORE_PATH points to location of keystore file (ie MMU.keystore should be in root folder or android>app)
- location of keystore file determines if you are using a default keystore file or a custom file
- See Creating Keystore Files and Generating SHA-1 in Creating a React Native App document
- Keystore File should be on shared drive

4. MainActivity.kt (in src>main>java)

- change package

5. MainApplication.kt (in src>main>java)

- change package

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
