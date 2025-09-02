# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development
- `npm install` - Install dependencies (electron and electron-store)
- `npm start` - Launch the Electron application in development mode

### Piper TTS Setup (Apple Silicon)
For users on Apple Silicon Macs who need to compile Piper from source:
```bash
# Install dependencies
brew install cmake rust git automake libtool pkg-config espeak-ng

# See CompilePiper.md for detailed compilation instructions
# This is required if pre-built Piper binaries don't work
```

## Architecture Overview

### Application Structure
This is an **Electron-based desktop application** that provides a GUI for Piper TTS (Text-to-Speech). The architecture follows a modular pattern with clear separation between main process, renderer process, and UI modules.

**Main Process (`main.js`)**:
- Handles IPC communication between main and renderer processes
- Manages electron-store for persistent settings (window bounds, paths, last used models)
- Spawns child processes to run the Piper TTS executable
- Provides file system operations and dialog interfaces
- Auto-detects bundled Piper executable and voice models

**Renderer Process Architecture**:
- `index.html` - Main UI structure with audio player, settings panels, and controls
- `preload.js` - Secure context bridge exposing IPC APIs to renderer
- Modular JavaScript in `scripts/` directory:
  - `dom.js` - Main entry point, event handlers, and module coordination
  - `tss.js` - Text-to-speech operations and progress tracking
  - `settings.js` - Configuration management and voice model loading
  - `states.js` - UI state management and validation
  - `audio.js` - Audio player controls and event handling
  - `dragdrop.js` - File drag-and-drop functionality
  - `utils.js` - Utility functions (duration formatting, etc.)

### Key Design Patterns

**Settings Persistence**: Uses electron-store to remember user preferences across sessions, including window position, last used voice model, and file paths.

**Process Management**: Spawns Piper TTS as child processes with stdin/stdout piping for text input and manages process lifecycle including cancellation.

**File Validation**: Implements intelligent text file detection supporting various formats (.txt, .md, .js, .json, etc.) with both extension-based and content-based validation.

**Modular Frontend**: ES6 modules with clear separation of concerns - DOM manipulation, audio controls, settings, and TTS operations are isolated.

## Important Context

### Piper TTS Integration
- Requires external Piper executable (can be bundled in root directory)
- Voice models are `.onnx` files with corresponding `.onnx.json` metadata
- Default model directory is `./voices/`
- Supports real-time voice preview and batch text processing

### Platform Considerations
- **Apple Silicon**: May require custom Piper compilation (see `CompilePiper.md`)
- **Cross-platform**: Handles executable detection across Windows (.exe), macOS, and Linux
- **File permissions**: Validates executable permissions before attempting to run Piper

### State Management
- Window bounds and position are persistent
- Settings stored in platform-appropriate locations:
  - macOS: `~/Library/Application Support/piper-electron/config.json`
  - Windows: `%APPDATA%/piper-electron/config.json`  
  - Linux: `~/.config/piper-electron/config.json`

### Audio Pipeline
- Generates WAV files as intermediate format
- Built-in HTML5 audio player with play/pause/stop controls
- Cache-busting for audio files to handle updates
- Temporary files for voice previews

### Text Processing Features
- Drag-and-drop file support with validation
- Large file handling (prompts for direct processing without loading into textarea)
- Progress estimation based on text length and words per minute
- Support for various text file formats with intelligent content detection

## Development Notes

### Key Dependencies
- **Electron 36.4.0**: Desktop application framework
- **electron-store 10.1.0**: Persistent configuration storage

### No Testing Framework
This project currently has no testing setup. Consider adding tests for:
- File validation logic
- Settings persistence
- Audio player functionality
- Process management and cleanup

### Electron IPC Pattern
Uses secure context bridge pattern with `contextBridge.exposeInMainWorld()` rather than `nodeIntegration: true` for security. All main process interactions go through the `piperAPI` interface defined in `preload.js`.
