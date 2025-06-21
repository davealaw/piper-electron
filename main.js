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

const defaultPiperPath = path.join(__dirname, 'piper');
const defaultModelDir = path.join(__dirname, 'voices');

if (!store.get('piperPath') || !fs.existsSync(store.get('piperPath'))) {
  if (fs.existsSync(defaultPiperPath)) {
    store.set('piperPath', defaultPiperPath);
  }
}

if (!store.get('modelDirectory') || !fs.existsSync(store.get('modelDirectory'))) {
  if (fs.existsSync(defaultModelDir)) {
    store.set('modelDirectory', defaultModelDir);
  }
}

let currentProcess = null;

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

    proc.stdin.write(text);
    proc.stdin.end();

    proc.on('close', (code) => {
      currentProcess = null;
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Piper failed with code ' + code));
      }
    });
  });
});

ipcMain.handle('preview-voice', async (_event, modelPath) => {
  const previewText = "This is a sample of the selected voice.";
  const outputFile = path.join(app.getPath('temp'), 'piper-voice-preview.wav');

  return new Promise((resolve, reject) => {
    const piperPath = store.get('piperPath');
    if (!piperPath || !fs.existsSync(piperPath)) {
      return reject(new Error("Piper path is not configured correctly."));
    }

    const piper = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outputFile
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    piper.stdin.write(previewText);
    piper.stdin.end();

    piper.on('exit', code => {
      if (code === 0) {
        resolve(outputFile);
      } else {
        reject(new Error(`Preview failed with code ${code}`));
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

  // Set default piper path if it exists
  if (fs.existsSync(defaultPiperPath)) {
    store.set('piperPath', defaultPiperPath);
  }

  // Set default model directory if it exists
  if (fs.existsSync(defaultModelDir)) {
    store.set('modelDirectory', defaultModelDir);
  }

  return {
    piperPath: store.get('piperPath'),
    modelDirectory: store.get('modelDirectory'),
  };
});

ipcMain.handle('get-voice-models', async () => {
  const modelDir = store.get('modelDirectory');
  if (!modelDir || !fs.existsSync(modelDir)) return [];

  const models = fs.readdirSync(modelDir)
    .filter(name => name.endsWith('.onnx'))
    .map(name => {
      const fullPath = path.join(modelDir, name);
      const jsonPath = fullPath + '.json'; // instead of replacing extension
      return fs.existsSync(jsonPath) ? fullPath : null;
    })
    .filter(Boolean);

  return models;
});

ipcMain.handle('choose-model-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Model Directory',
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const folder = result.filePaths[0];
  store.set('modelDirectory', folder);
  return folder;
});

ipcMain.handle('get-model-directory', () => {
  return store.get('modelDirectory');
});

ipcMain.handle('validate-model-path', (_event, modelPath) => {
  return fs.existsSync(modelPath);
});

ipcMain.handle('read-text-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Text File',
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths[0]) return null;

  const filePath = filePaths[0];
  const stats = fs.statSync(filePath);
  if (stats.size > 1024 * 1024) return { tooLarge: true, path: filePath }; // >1MB

  const text = fs.readFileSync(filePath, 'utf-8');
  return { text, path: filePath };
});

ipcMain.handle('speak-text-file', async (_, filePath, modelPath, outputPath) => {
  
  return new Promise((resolve, reject) => {
    const child = spawn(piperPath, [
      '--model', modelPath,
      '--output_file', outputPath
    ]);

    fs.createReadStream(filePath).pipe(child.stdin);

    child.on('exit', code => {
      if (code === 0) resolve(outputPath);
      else reject(new Error(`Piper exited with code ${code}`));
    });
  });
});
