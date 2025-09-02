
async function populateVoices() {
  const voices = await window.piperAPI.getVoiceModels();
  const select = document.getElementById('modelSelect');
  select.innerHTML = '';

  if (!voices.length) {
    const opt = document.createElement('option');
    opt.text = 'No models found';
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }

  voices.forEach(model => {
    const opt = document.createElement('option');
    opt.value = model;
    opt.text = model.split('/').pop(); // or format however you like
    select.appendChild(opt);
  });

  // Select previously saved model if still valid
  const last = await window.piperAPI.getLastSettings();
  if (last?.lastModel && voices.includes(last.lastModel)) {
    select.value = last.lastModel;
  }
}

async function selectModelDirectory() {
  const folder = await window.piperAPI.chooseModelDirectory();
  if (folder) {
    document.getElementById('modelDirDisplay').textContent = folder;
    await populateVoices(); // re-load voice list
  }
}

async function loadSettings() {
  const settings = await window.piperAPI.getLastSettings();

  if (settings.lastText) {
    document.getElementById('textInput').value = settings.lastText;
  }

  if (settings.lastOutput) {
    document.getElementById('outputPath').value = settings.lastOutput;
  }

  document.getElementById('status').textContent = '';

  const path = await window.piperAPI.getPiperPath();
  if (path) {
    document.getElementById('piperPathDisplay').textContent = path;
  }

  // Load saved model directory (if any)
  const modelDir = await window.piperAPI.getModelDirectory();
  if (modelDir) {
    document.getElementById('modelDirDisplay').textContent = modelDir;
    await populateVoices(); // <== this is essential
  } else {
    document.getElementById('modelDirDisplay').textContent = 'No directory selected';
  }

  // Load last settings like text/model/output
  if (settings.lastModel) {
    const voiceSelect = document.getElementById('modelSelect');
    const option = Array.from(voiceSelect.options).find(opt => opt.value === settings.lastModel);
    if (option) {
      voiceSelect.value = settings.lastModel;
    }
  }
}

async function choosePiper() {
  const selected = await window.piperAPI.choosePiperPath();
  if (selected) {
    document.getElementById('piperPathDisplay').textContent = selected;
    updateSpeakButtonState();
  }
}

