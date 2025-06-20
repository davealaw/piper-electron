const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('piperAPI', {
  speak: (text, modelPath, outputPath) => ipcRenderer.invoke('run-piper', text, modelPath, outputPath),
  getVoiceModels: () => ipcRenderer.invoke('get-voice-models'),
  chooseOutputFile: () => ipcRenderer.invoke('choose-output-file'),
  getLastSettings: () => ipcRenderer.invoke('get-last-settings'),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  choosePiperPath: () => ipcRenderer.invoke('choose-piper-path'),
  getPiperPath: () => ipcRenderer.invoke('get-piper-path'),
  validatePiperPath: () => ipcRenderer.invoke('validate-piper-path'),
  chooseModelDirectory: () => ipcRenderer.invoke('choose-model-directory'),
  getModelDirectory: () => ipcRenderer.invoke('get-model-directory'),  
  cancelSpeak: () => ipcRenderer.invoke('cancel-speak')
});

