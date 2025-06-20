const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Store = require('electron-store').default;
const store = new Store({
  defaults: {
    lastModel: '',
    lastText: '',
    windowBounds: { width: 800, height: 600, x: undefined, y: undefined },
    piperPath: ''
  }
});

let currentProcess = null;
let currentAudioFile = null;

function createWindow() {
  const winBounds = store.get('windowBounds', { width: 500, height: 500 });
  const win = new BrowserWindow({
    ...winBounds,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');

  // Save size and position on close
  win.on('close', () => {
    store.set('windowBounds', win.getBounds());
  });
}

app.whenReady().then(createWindow);

ipcMain.handle('choose-piper-path', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Piper Executable',
    properties: ['openFile'],
    filters: process.platform === 'win32' ? [{ name: 'Executable', extensions: ['exe'] }] : []
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    store.set('piperPath', selectedPath);
    return selectedPath;
  }

  return null;
});

ipcMain.handle('get-piper-path', () => {
  return store.get('piperPath');
});

ipcMain.handle('validate-piper-path', () => {
  const piperPath = store.get('piperPath');
  try {
    return !!(
      piperPath &&
      fs.existsSync(piperPath) &&
      fs.lstatSync(piperPath).isFile() &&
      fs.accessSync(piperPath, fs.constants.X_OK) === undefined
    );
  } catch {
    return false;
  }
});

ipcMain.handle('choose-output-file', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Save Output Audio',
    defaultPath: 'piper-output.wav',
    filters: [{ name: 'WAV files', extensions: ['wav'] }]
  });

  if (!result.canceled && result.filePath) {
    store.set('lastOutput', result.filePath);
    return result.filePath;
  }
});

ipcMain.handle('run-piper', async (_event, text, modelPath, outFile) => {
  const piperPath = store.get('piperPath');
  if (!piperPath || !fs.existsSync(piperPath) || !fs.lstatSync(piperPath).isFile()) {
    throw new Error('Piper path not configured or invalid');
  }

  // ✅ Save current state to store
  store.set('lastText', text);
  store.set('lastModel', modelPath);
  store.set('lastOutput', outFile);

  return new Promise((resolve, reject) => {
    const proc = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outFile
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    currentProcess = proc;
    currentAudioFile = outFile;

    proc.stdin.write(text);
    proc.stdin.end();

    proc.on('close', (code) => {
      currentProcess = null;
      if (code === 0) {
        currentAudioFile = outFile;
        resolve();
      } else {
        reject(new Error('Piper failed with code ' + code));
      }
    });
  });
});

ipcMain.handle('cancel-speak', async () => {
  if (currentProcess) {
    try {
      currentProcess.kill();
      currentProcess = null;
      return true;
    } catch (err) {
      console.error('Failed to cancel process:', err);
    }
  }
  return false;
});

ipcMain.handle('get-last-settings', async () => {
  return {
    lastModel: store.get('lastModel', null),
    lastOutput: store.get('lastOutput', null),
    lastText: store.get('lastText', '')
  };
});

ipcMain.handle('reset-settings', async () => {
  store.clear();
  return true;
});

ipcMain.handle('get-voice-models', async () => {
  const voiceDir = path.join(__dirname, 'voices');
  try {
    const files = fs.readdirSync(voiceDir);
    const models = files.filter(f => f.endsWith('.onnx'));

    // Only return models with matching .config.json
    const validModels = models.filter(model => {
      const config = path.join(voiceDir, model + '.json');
      return fs.existsSync(config);
    });

    return validModels.map(f => path.join(voiceDir, f));
  } catch (e) {
    console.error('[VOICES] Error reading models:', e);
    return [];
  }
});

