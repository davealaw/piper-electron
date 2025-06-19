const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('piperAPI', {
  speak: (text, modelPath, outputPath) => ipcRenderer.invoke('run-piper', text, modelPath, outputPath),
  getVoiceModels: () => ipcRenderer.invoke('get-voice-models'),
  chooseOutputFile: () => ipcRenderer.invoke('choose-output-file'),
  getLastSettings: () => ipcRenderer.invoke('get-last-settings'),
  resetSettings: () => ipcRenderer.invoke('reset-settings')
});
