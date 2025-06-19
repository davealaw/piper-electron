const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Store = require('electron-store').default;
const store = new Store();

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

// 👇 Replace this with the actual path to your Piper binary
const piperPath = '/Users/davealaw/piper/build/piper';


ipcMain.handle('choose-output-file', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Save Output Audio',
    defaultPath: 'piper-output.wav',
    filters: [{ name: 'WAV files', extensions: ['wav'] }]
  });

  return result.canceled ? null : result.filePath;
});

ipcMain.handle('run-piper', async (_, text, modelPath, outputPath) => {
  const configPath = modelPath + '.json';
  if (!fs.existsSync(modelPath) || !fs.existsSync(configPath)) {
    throw new Error(`Model or config missing: ${modelPath}`);
  }

  const outFile = outputPath || path.join(__dirname, 'out.wav');

  // Save settings persistently
  store.set('lastModel', modelPath);
  store.set('lastOutput', outFile);
  store.set('lastText', text);

  const args = ['--model', modelPath, '--output_file', outFile];

  console.log('[PIPER] Running:', piperPath, args.join(' '));

  return new Promise((resolve, reject) => {
    const piper = spawn(piperPath, args);
    let stderr = '';

    piper.stdin.write(text);
    piper.stdin.end();

    piper.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    piper.on('close', (code) => {
      if (code !== 0) {
        reject(`Piper failed with code ${code}: ${stderr}`);
      } else {
        const afplay = spawn('afplay', [outFile]);
        afplay.on('error', err => reject(`Playback failed: ${err.message}`));
        afplay.on('close', () => resolve('Success'));
      }
    });
  });
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

