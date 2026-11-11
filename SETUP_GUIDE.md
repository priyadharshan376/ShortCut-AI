# ShortCut AI - Complete Setup & Channel Connection Guide

This comprehensive guide walks you through setting up **ShortCut AI** from scratch, obtaining free Google Cloud YouTube API credentials, connecting your YouTube channel, and publishing automated 9:16 Shorts.

---

## Table of Contents
1. [System Prerequisites](#1-system-prerequisites)
2. [Quick Installation](#2-quick-installation)
3. [Setting Up Google Cloud & YouTube Data API v3](#3-setting-up-google-cloud--youtube-data-api-v3)
4. [Connecting Your YouTube Channel](#4-connecting-your-youtube-channel)
5. [Important: YouTube Channel Verification (Preventing Upload Limits)](#5-important-youtube-channel-verification)
6. [Using ShortCut AI](#6-using-shortcut-ai)
   - [Local File Uploads (Up to 1.5 GB)](#local-file-uploads-up-to-15-gb)
   - [YouTube URL Importer](#youtube-url-importer)
   - [Layout Modes (9:16 Vertical)](#layout-modes-916-vertical)
   - [Batch Interval Scheduling (20–30 min intervals)](#batch-interval-scheduling)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. System Prerequisites

Before running ShortCut AI, ensure you have the following installed on your computer:

| Tool | Recommended Version | Download Link | Notes |
|------|--------------------|---------------|-------|
| **Python** | 3.10, 3.11, or 3.12 | [python.org](https://www.python.org/downloads/) | **Check "Add Python to PATH"** during setup! |
| **Node.js** | 18 LTS or 20 LTS | [nodejs.org](https://nodejs.org/) | Required for the web UI and YouTube bot solver |
| **FFmpeg** | Latest Release | [gyan.dev](https://www.gyan.dev/ffmpeg/builds/) or WinGet | Required for video trimming, audio extraction & rendering |

> **Quick Windows FFmpeg Install (via PowerShell):**
> ```powershell
> winget install Gyan.FFmpeg
> ```

---

## 2. Quick Installation

1. Open the project folder in Windows Explorer:
   ```
   shortcutai/
   ```
2. Double-click **`Setup.bat`**.
   - This script automatically verifies Python, Node.js, and FFmpeg.
   - It creates an isolated Python virtual environment (`.\venv`).
   - It installs all backend Python packages (`backend/requirements.txt`).
   - It compiles the high-performance React + Vite frontend (`frontend/dist`).
3. Once completed, you are ready to configure YouTube access!

---

## 3. Setting Up Google Cloud & YouTube Data API v3

YouTube's API allows ShortCut AI to upload videos directly to your channel on your behalf without storing your Google password.

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the Google Account that owns your YouTube channel.
3. Click the project dropdown in the top bar and click **New Project**.
4. Name it `ShortCut AI` (or whatever you prefer) and click **Create**.
5. Ensure your new project is selected in the top bar.

### Step 2: Enable YouTube Data API v3
1. In the search bar at the top, search for **YouTube Data API v3**.
2. Click on it in the results, then click the blue **Enable** button.

### Step 3: Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select User Type: **External**, then click **Create**.
3. Fill in the required fields:
   - **App name:** `ShortCut AI`
   - **User support email:** Select your email
   - **Developer contact information:** Enter your email
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes**:
   - Filter or scroll down and select:
     - `.../auth/youtube.upload` (Upload YouTube videos)
     - `.../auth/youtube.readonly` (View YouTube account details & channel avatar)
   - Click **Update**, then **Save and Continue**.
6. Under **Test Users** (CRITICAL STEP):
   - Click **+ Add Users**.
   - Type the exact Gmail address associated with your YouTube channel.
   - Click **Add**, then **Save and Continue**.

### Step 4: Create OAuth 2.0 Client ID Credentials
1. In the left sidebar, click **Credentials**.
2. Click **+ Create Credentials** at the top > select **OAuth client ID**.
3. Under Application Type, select **Desktop app**.
4. Name it `ShortCut AI Desktop Client` and click **Create**.
5. A popup will show "OAuth client created". Click **Download JSON**.
6. Save this downloaded file into the root of the `shortcutai` directory as:
   ```
   shortcutai/client_secrets.json
   ```

---

## 4. Connecting Your YouTube Channel

You have two easy ways to authorize your channel:

### Option A: Inside the Web UI (Easiest)
1. Launch the app by double-clicking **`Start_ShortCutAI.bat`**.
2. In the dashboard header, click the purple **"Connect YouTube Channel"** button.
3. Choose either:
   - **Upload `client_secrets.json`** file directly from your computer, OR
   - **Paste JSON Credentials** content directly into the text area.
4. Click **"Save Credentials & Connect Channel"**.
5. A browser window will open asking you to sign in with your Google account. Click **Allow**.
6. Done! The dashboard will immediately display your YouTube channel name, avatar, and handle.

### Option B: Using the Windows Batch Helper
1. Ensure `client_secrets.json` is placed in the project root.
2. Double-click **`Connect_YouTube.bat`**.
3. A Google sign-in tab will open in your browser.
4. Select your channel's account and click **Allow**.
5. When the console displays `[SUCCESS] YouTube Channel Connected Successfully!`, you're done.

---

## 5. Important: YouTube Channel Verification

> [!WARNING]
> **Avoid `uploadLimitExceeded` Errors:**
> YouTube enforces strict daily upload limits on unverified channels (often only 3–5 videos per day). To unlock higher daily limits:
> 1. Go to [YouTube Studio](https://studio.youtube.com).
> 2. Click **Settings** (bottom left gear icon) > **Channel** > **Feature eligibility**.
> 3. Check **Intermediate features** (requires a standard SMS phone number verification).
> 4. For maximum daily Shorts uploads, also consider enabling **Advanced features** (via video verification or building channel history).

---

## 6. Using ShortCut AI

### Local File Uploads (Up to 1.5 GB)
- Drag and drop any long-form video (`.mp4`, `.mov`, `.mkv`, `.avi`) up to **1.5 GB**.
- A real-time byte-level progress bar displays exact upload speed, percentage, and size transferred.
- A 4-stage pipeline stepper displays live status:
  1. File Upload
  2. Faster-Whisper CPU Speech Transcription
  3. 6-Dimension AI Viral Scoring & Narrative Moment Extraction
  4. 9:16 Shorts Ready for Review

### YouTube URL Importer
- Switch to the **YouTube URL** tab.
- Paste any standard YouTube link (e.g. `https://www.youtube.com/watch?v=...` or Shorts link).
- Click **Inspect Video** to view the thumbnail, channel, duration, and available resolutions (360p, 480p, 720p, 1080p).
- Select your target quality and click **Download & Analyze** to automatically pull the video and extract viral clips.

### Layout Modes (9:16 Vertical)
When previewing or scheduling clips, select your preferred vertical layout:
1. **Blur Background (Recommended):** Centers the landscape video with a beautifully blurred, motion-matched replica filling the top and bottom borders.
2. **Auto Intelligent:** Automatically detects letterboxing and optimizes zoom and fill ratio.
3. **Smart Center Crop:** Crops the horizontal video directly into a full 9:16 frame centered on the action.

### Batch Interval Scheduling
- Select multiple clips in the editor or click **"Schedule All"** in the dashboard.
- Pick your start time and choose your interval:
  - **20 minutes** (Recommended for viral pacing)
  - **30 minutes** (Standard YouTube Shorts cadence)
  - **Custom intervals**
- Choose visibility: **Public**, **Unlisted**, or **Private**.
- ShortCut AI automatically staggers upload timestamps and tracks live upload progress in a global floating queue tracker.

---

## 7. Troubleshooting & FAQs

### Q: "Sign in to confirm you're not a bot" when downloading YouTube URLs?
- ShortCut AI includes an integrated Node.js JavaScript challenge solver. Ensure Node.js LTS is installed.
- For age-restricted or members-only videos, you can place a standard `cookies.txt` file (exported from Chrome or Firefox using an extension like *Get cookies.txt LOCALLY*) into the project root directory.

### Q: Google OAuth displays "Access blocked: ShortCut AI has not completed the Google verification process"?
- This happens if your Google Cloud app is in "Testing" mode and your email has not been added under **Test Users**.
- Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **OAuth consent screen** > **Test Users** > click **+ Add Users** and enter your channel's Gmail address.

### Q: How do I disconnect or switch to another YouTube channel?
- In the dashboard, click the **Disconnect** button next to your channel name, or delete `backend/database/youtube_token.json` and reconnect.

### Q: How do I stop the server?
- Double-click **`Stop_ShortCutAI.bat`** or press `Ctrl + C` in the running command window.
