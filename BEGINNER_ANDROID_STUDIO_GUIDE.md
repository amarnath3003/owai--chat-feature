# 🔰 Absolute Beginner's Guide to Android Studio (for PocketAI)

Since you are new to Android Studio, this guide will walk you through exactly where to click and how to set everything up from scratch.

---

## Step 1: Install the Right Tools
1. **Download Android Studio**: Go to [developer.android.com/studio](https://developer.android.com/studio) and download the latest version.
2. **Install**: Run the installer. When it asks for **"Install Type"**, choose **Standard**.
3. **Finish**: Let it download the components. It might take a while.

---

## Step 2: Install the AI "Engine" Requirements
PocketAI needs specific tools to build the AI part (`llama.rn`).

1. Open Android Studio.
2. On the welcome screen, click **More Actions** > **SDK Manager**.
3. In the window that opens:
   - Go to the **SDK Tools** tab (middle tab).
   - Check the box for **"Show Package Details"** (bottom right).
   - Find **NDK (Side by side)** and check version **26.1.10909125** (or any 26.x version).
   - Find **CMake** and check version **3.22.1** (or higher).
4. Click **Apply** and wait for the download to finish.

---

## Step 3: Open the Project Correctly
**Crucial Rule:** When opening in Android Studio, you must open the **`android`** folder, not the main `PocketAI` folder.

1. Click **Open** on the Android Studio welcome screen.
2. Navigate to: `C:\Coding Projects\ai_chat_owai\PocketAI\android`.
3. Click **OK**.
4. **Wait**: Look at the bottom right corner. You will see a "Gradle Sync" loading bar. **Do not touch anything** until this finishes. It could take 5-10 minutes the first time.

---

## Step 4: Create your Virtual Phone (Emulator)
1. In the top right corner of Android Studio, click the **Device Manager** icon (it looks like a small phone with a gear).
2. Click the **+** (plus) icon or **Create Device**.
3. Choose **Phone** > **Pixel 8**. Click **Next**.
4. Under **System Image**, find **UpsideDownCake (API 34)**. Click the **Download** arrow next to it. Once done, select it and click **Next**.
5. **Give it more RAM** (Important for AI):
   - On the final screen, click **Show Advanced Settings**.
   - Scroll down to **Memory and Storage**.
   - Change **RAM** to `4096 MB` (4GB).
6. Click **Finish**.
7. In the Device Manager, click the **Green Play Button** next to your new phone to turn it on.

---

## Step 5: Start the "Brain" (Metro)
Before running the app, you must start the JavaScript server.

1. Open a normal Windows terminal (Command Prompt or PowerShell).
2. Type this:
   ```cmd
   cd "C:\Coding Projects\ai_chat_owai\PocketAI"
   npx react-native start
   ```
3. Keep this window open! If you close it, the app won't work.

---

## Step 6: Run the App
1. Go back to **Android Studio**.
2. Look at the top toolbar. You should see `app` and the name of your Pixel 8 emulator.
3. Click the **Green Play Arrow** (next to the device name) or press `Shift + F10`.
4. **The first build takes time**: It has to compile the AI code. It might look like it's stuck for 5 minutes—this is normal.

---

## Summary of "Where to click" icons:
- **SDK Manager**: ⚙️ (Gear) or "More Actions"
- **Device Manager**: 📱 (Phone icon)
- **Run App**: ▶️ (Green triangle)
- **Sync Files**: 🐘 (Small blue elephant icon - use this if you change `build.gradle`)
