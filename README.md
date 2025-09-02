# Piper TTS GUI

A user-friendly Electron-based graphical interface for [Piper](https://github.com/rhasspy/piper), a fast, local neural text-to-speech system. This application provides an intuitive way to convert text to speech using high-quality neural voices without requiring an internet connection.

![Piper TTS GUI Screenshot](https://via.placeholder.com/800x600?text=Piper+TTS+GUI)

## Features

### 🎤 High-Quality Text-to-Speech
- Multiple neural voice models with different accents and languages
- Fast, local processing - no internet required
- High-quality audio output in WAV format
- Real-time voice preview functionality

### 📝 Text Input Options
- Large text area for manual input
- Load text from files (supports various formats: .txt, .md, .html, .js, .json, etc.)
- Drag-and-drop file support
- Text content validation for different file types

### 🎛️ User-Friendly Interface
- Clean, intuitive GUI built with Electron
- Persistent settings (remembers your preferences)
- Window size and position memory
- Progress tracking for long text processing

### 🔊 Audio Controls
- Built-in audio player with play/pause/stop controls
- Custom output file selection
- Audio preview before saving

### ⚙️ Configuration
- Custom Piper executable path selection
- Voice model directory configuration
- Automatic detection of bundled Piper executable
- Settings persistence across sessions

## Installation

### Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Piper TTS executable** (included or can be downloaded separately)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd piper-electron
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

### Setting up Piper TTS

This application requires the Piper TTS executable and voice models:

#### Option 1: Use bundled Piper (if available)
If a `piper` executable is included in the project directory, it will be automatically detected.

#### Option 2: Download Piper separately
1. Download Piper from the [official releases](https://github.com/rhasspy/piper/releases)
2. Extract the executable
3. Use the "Choose Piper Executable" button in the app to select it

#### Option 3: Compile Piper from source (Apple Silicon)
For Apple Silicon Mac users who need to compile Piper from source:
- See **[CompilePiper.md](./CompilePiper.md)** for detailed compilation instructions
- This is particularly useful if pre-built binaries don't work on your system
- The guide includes specific steps for resolving Apple Silicon compatibility issues

#### Voice Models
1. Download voice models from [Piper's voice samples](https://rhasspy.github.io/piper-samples/)
2. Place `.onnx` and `.onnx.json` files in the `voices` directory
3. Or use "Choose Model Folder" to select a custom directory

## Usage

### Basic Text-to-Speech

1. **Configure Piper:** Ensure the Piper executable path is set (first-time setup)
2. **Select a Voice:** Choose from available voice models in the dropdown
3. **Enter Text:** Type or paste text in the text area, or load from a file
4. **Generate Speech:** Click "Speak" to convert text to audio
5. **Play Audio:** Use the built-in controls to play the generated audio

### Loading Text Files

- **Click "Load Text File"** to browse and select a text file
- **Drag and drop** supported text files directly onto the text area
- Supported formats: `.txt`, `.md`, `.html`, `.js`, `.json`, `.css`, `.py`, and more

### Voice Preview

- Select any voice model and click **"Preview Voice"** to hear a sample
- Helps you choose the right voice before processing large amounts of text

### Custom Output

- By default, audio is saved as `piper-output.wav`
- Use **"Browse..."** next to the output field to choose a custom location and filename
- Only WAV format is supported

## Available Voice Models

The application comes with several high-quality voice models:

- **en_US-amy-medium**: American English, female voice
- **en_US-ryan-high**: American English, male voice (high quality)
- **en_GB-northern_english_male-medium**: British English, male voice
- **cori-high**: High-quality female voice
- **jenny**: Female voice
- **kristin**: Female voice
- **norman**: Male voice

## Keyboard Shortcuts

- **Ctrl/Cmd + L**: Load text file
- **Ctrl/Cmd + Enter**: Start speech synthesis
- **Escape**: Cancel current synthesis (if running)

## Configuration Files

The application stores settings in:
- **macOS**: `~/Library/Application Support/piper-electron/config.json`
- **Windows**: `%APPDATA%/piper-electron/config.json`
- **Linux**: `~/.config/piper-electron/config.json`

Settings include:
- Last used voice model
- Last entered text
- Window size and position
- Piper executable path
- Model directory path

## Troubleshooting

### Common Issues

**"Piper path not configured or invalid"**
- Ensure you've selected a valid Piper executable
- Check that the executable has proper permissions
- Try downloading the latest Piper release

**"No voice models found"**
- Verify that `.onnx` and corresponding `.onnx.json` files are in the voices directory
- Ensure model files are not corrupted
- Check that the model directory path is correct

**Audio doesn't play**
- Confirm the output file was created successfully
- Check system audio settings
- Try a different output location with write permissions

### Reset to Defaults

Click the **"Reset to Defaults"** button to restore all settings to their original state.

## Development

### Project Structure

```
piper-electron/
├── main.js              # Main Electron process
├── index.html           # Main UI
├── preload.js           # Preload script for IPC
├── package.json         # Dependencies and scripts
├── voices/              # Voice model files (.onnx)
├── scripts/             # Frontend JavaScript modules
│   ├── dom.js          # DOM manipulation
│   ├── audio.js        # Audio controls
│   ├── settings.js     # Settings management
│   ├── tss.js          # TTS functionality
│   └── utils.js        # Utility functions
├── styles/              # CSS stylesheets
└── piper               # Piper executable (if bundled)
```

### Building for Distribution

```bash
# Install electron-builder for packaging
npm install --save-dev electron-builder

# Build for current platform
npm run build
```

### Adding New Voice Models

1. Download `.onnx` and `.onnx.json` files from Piper's model repository
2. Place both files in the `voices/` directory
3. Restart the application to detect new models

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - the same license as [Piper TTS](https://github.com/rhasspy/piper). See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Piper TTS](https://github.com/rhasspy/piper) - The underlying text-to-speech engine
- [Electron](https://www.electronjs.org/) - The cross-platform desktop framework
- Voice models from the Piper community

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information about your problem

---

**Note**: This application requires the Piper TTS engine to function. Make sure to properly configure the Piper executable path and have voice models available before use.
