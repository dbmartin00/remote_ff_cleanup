# Aria - Split.io Feature Flag Demo

Console demonstration app showing Split.io SDK feature flag evaluation in real-time.

## Prerequisites

- Node.js 18 or higher
- Split.io account (or Harness Feature Management)
- Server-side SDK API key

## Setup

### 1. Create Feature Flags in Split.io

Create three flags in your Split.io workspace:

**Flag: `abcedarian`**
- Type: Boolean (on/off)
- Effect: Transforms demo text to UPPERCASE

**Flag: `beauty`**
- Type: Boolean (on/off)
- Effect: Adds color highlighting to demo text

**Flag: `chilton`**
- Type: Boolean (on/off)
- Effect: Shows splash title "Real time flag updates!" at top of screen

### 2. Get SDK API Key

1. Go to Split.io UI → Admin → API Keys
2. Navigate to "SDK Keys" section
3. Copy your **Server-side SDK key**

⚠️ **Important**: Use the SDK key, NOT the Admin API key. They have different formats and permissions.

### 3. Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your SDK key
SPLIT_API_KEY=your_actual_sdk_key_here
```

### 4. Install and Run

```bash
npm install
npm start
```

## Usage

The app displays a status bar showing current flag states and demo content below.

**Keyboard Controls**:
- `a` - Re-evaluate abcedarian flag state
- `b` - Re-evaluate beauty flag state
- `c` - Re-evaluate chilton flag state
- `q` - Quit application

**Testing Flag Changes**:
1. Leave the app running
2. Open Split.io UI in your browser
3. Toggle flag states (on/off, change chilton config)
4. Watch the display update immediately (via SDK_UPDATE event)
5. Or press corresponding key ('a'/'b'/'c') to manually refresh
6. Changes appear instantly without waiting

## How It Works

This app uses the **Split.io SDK** (read-only) to evaluate flag treatments:
- `getTreatment(key, flagName)` - Returns 'on', 'off', or 'control'
- Server-side SDK requires a user/key as first parameter

**Different from toggler app**: 
- Toggler uses Admin API to **modify** flags (write operations)
- Aria uses SDK to **evaluate** flags (read operations)

## Troubleshooting

**"SDK initialization timed out"**
- Check that SPLIT_API_KEY is set in .env
- Verify the key is a valid SDK key (not Admin API key)
- Check network connectivity

**"SPLIT_API_KEY not set"**
- Create .env file with your SDK key
- Don't commit .env to git (already in .gitignore)

**Flags show 'control' treatment**
- Flag doesn't exist in Split.io yet
- Create the flag with matching name (case-sensitive)

**Changes not appearing**
- Press the flag's key (a/b/c) to force refresh
- SDK may take a few seconds to sync from Split.io (normal)
- SDK_UPDATE event fires automatically when changes are detected

## Architecture

- **Single file**: `index.js` (~260 lines)
- **Dependencies**: @splitsoftware/splitio, dotenv
- **UI**: Pure readline + ANSI escape codes (no external UI libs)
- **Update mechanism**: Event-driven via SDK_UPDATE (immediate, no polling)

## Flag Effects

| Flag | On State | Off State |
|------|----------|-----------|
| abcedarian | ALL TEXT IN CAPS | Normal case |
| beauty | Colorful highlights | Plain text |
| chilton | Splash title shown | No splash title |
