# 📱 Running PocketAI on Android Emulator

Follow these steps to set up and run the PocketAI app using Android Studio's emulated smartphone.

---

## 1. Prerequisites

Ensure you have the following installed and configured:
- **Android Studio**: Latest version (Hedgehog or newer recommended).
- **Android SDK**: Including API level 34+.
- **Android NDK**: Version **26.x.x** (required for `llama.rn` native C++ compilation).
- **CMake**: Installed via Android Studio SDK Manager.

---

## 2. Set Up an Emulator (AVD)

1. Open **Android Studio**.
2. Go to **Tools > Device Manager**.
3. Click **Create Device**.
4. Select a phone (e.g., **Pixel 7** or **Pixel 8**).
5. Select a system image (e.g., **API 34** / Android 14.0).
6. **IMPORTANT**: Give the emulator at least **4GB - 8GB of RAM** if possible:
   - In Device Manager, click the **pencil icon (Edit)** next to your emulator.
   - Click **Show Advanced Settings**.
   - Scroll to **Memory and Storage**.
   - Set **RAM** to `4096` MB or higher (LLMs are memory intensive).
7. Start the emulator by clicking the **Play** button.

---

## 3. Configure Native Build (`llama.rn`)

You must tell the Android build system how to compile the C++ AI engine.

1. Open `PocketAI/android/app/build.gradle`.
2. Ensure the following is added inside the `android { ... }` block:

```groovy
android {
    // ...
    defaultConfig {
        // ...
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++17"
                abiFilters "arm64-v8a", "x86_64"
            }
        }
    }

    externalNativeBuild {
        cmake {
            path "../../node_modules/llama.rn/android/CMakeLists.txt"
        }
    }

    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }
}
```

3. Ensure your `PocketAI/android/local.properties` file points to your NDK:
```properties
ndk.dir=C\:\\Users\\YourUser\\AppData\\Local\\Android\\Sndk\\26.x.x
```

---

## 4. Run the Application

Once the emulator is running:

### Step A: Start Metro (The JS Bundler)
Open a terminal in the `PocketAI` directory and run:
```bash
npx react-native start
```

### Step B: Launch the App
Open a **second** terminal in the `PocketAI` directory and run:
```bash
npx react-native run-android
```

Android Studio will now compile the C++ code for `llama.rn`, build the APK, and install it on your emulator.

---

## 💡 Troubleshooting

- **Build Fails (NDK Missing)**: Ensure NDK 26 is installed in Android Studio (SDK Manager > SDK Tools > Show Package Details > NDK (Side by side)).
- **App Crashes on Model Load**: This usually means the emulator ran out of RAM. Increase the RAM in the AVD Advanced Settings (see Step 2.6).
- **Inference is Slow**: Emulators use the host CPU. Performance will be slower than a physical high-end Android device.
