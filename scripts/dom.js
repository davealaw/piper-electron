window.addEventListener('DOMContentLoaded', async () => {
  initializeAudioPlayerEvents();
  initializeDragDropEvents();

  await loadSettings();

  document.getElementById('previewBtn').addEventListener('click', async () => {
    const modelPath = document.getElementById('modelSelect').value;
    if (!modelPath) {
      return;
    }

    try {
      const audioPath = await window.piperAPI.previewVoice(modelPath);

      // Bust the cache by appending a timestamp
      const audio = new Audio(`${audioPath}?t=${Date.now()}`);
      audio.play();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Voice preview failed:', err);
      alert('Voice preview failed. Check the console for details.');
    }
  });

  document.getElementById('loadTextFileBtn').addEventListener('click', async () => {
    const result = await window.piperAPI.readTextFile();

    if (!result) {
      return;
    }

    if (result.tooLarge) {
      if (confirm('File is large. Speak directly without preview?')) {
        const modelPath = document.getElementById('modelSelect').value;
        const outputPath = 'large-output.wav'; // or generate name
        await window.piperAPI.speakTextFile(result.path, modelPath, outputPath);
        new Audio(`${outputPath}?t=${Date.now()}`).play();
      }
    } else {
      document.getElementById('textInput').value = result.text;
      updateEstimatedDuration();
      updateSpeakButtonState();
    }
  });

  document.getElementById('clearTextBtn').addEventListener('click', () => {
    document.getElementById('textInput').value = '';
    updateSpeakButtonState();
  });

  document.getElementById('textInput').addEventListener('input', updateSpeakButtonState);
  document.getElementById('speakButton').addEventListener('click', speakText);
  document.getElementById('choosePiperButton').addEventListener('click', choosePiper);
  document.getElementById('selectModelDirectoryButton').addEventListener('click', selectModelDirectory);
  document.getElementById('resetToDefaultsButton').addEventListener('click', resetToDefaults);
  document.getElementById('chooseOutputButton').addEventListener('click', chooseOutput);
  document.getElementById('playAudioButton').addEventListener('click', playAudio);
  document.getElementById('pauseAudioButton').addEventListener('click', pauseAudio);
  document.getElementById('resumeAudioButton').addEventListener('click', resumeAudio);
  document.getElementById('stopAudioButton').addEventListener('click', stopAudio);

  updateSpeakButtonState();
});
