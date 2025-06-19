const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('piperAPI', {
  speak: (text, modelPath) => ipcRenderer.invoke('run-piper', text, modelPath),
  getVoiceModels: () => ipcRenderer.invoke('get-voice-models')
});
