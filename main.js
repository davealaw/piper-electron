const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// 👇 Replace this with the actual path to your Piper binary
const piperPath = '/Users/davealaw/piper/build/piper';

const { spawn } = require('child_process');

ipcMain.handle('choose-output-file', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Save Output Audio',
    defaultPath: 'piper-output.wav',
    filters: [{ name: 'WAV files', extensions: ['wav'] }]
  });

  return result.canceled ? null : result.filePath;
});

ipcMain.handle('run-piper', async (_, text, modelPath, outputPath) => {
  const piperCmd = piperPath;
  const outFile = outputPath || path.join(__dirname, 'out.wav');
  const piperArgs = ['--model', modelPath, '--output_file', outFile];

  console.log('[PIPER] Running:', piperCmd, piperArgs.join(' '));
  return new Promise((resolve, reject) => {
    const piper = spawn(piperCmd, piperArgs);
    let stderr = '';

    piper.stdin.write(text);
    piper.stdin.end();

    piper.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    piper.on('close', (code) => {
      if (code !== 0) {
        console.error('[PIPER] Error:', stderr);
        reject(`Piper failed with code ${code}: ${stderr}`);
      } else {
        console.log('[PIPER] Success, playing audio...');
        const afplay = spawn('afplay', [outFile]);
        afplay.on('error', (err) => {
          console.error('[AFPLAY] Error:', err.message);
          reject(`Playback failed: ${err.message}`);
        });
        afplay.on('close', () => {
          console.log('[AFPLAY] Done');
          resolve('Success');
        });
      }
    });
  });
});

const fs = require('fs');

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

