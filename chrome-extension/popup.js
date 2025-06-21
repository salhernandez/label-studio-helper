// Render the LLM Help toggle in the popup
function renderPopupOptions() {
  const popupOptionsDiv = document.getElementById('popupOptions');
  popupOptionsDiv.innerHTML = '';

  // Enable/Disable LLM Help toggle
  const llmLabel = document.createElement('label');
  llmLabel.className = 'form-switch d-flex align-items-center gap-2 mb-2';
  const llmToggle = document.createElement('input');
  llmToggle.type = 'checkbox';
  llmToggle.className = 'form-check-input';
  llmToggle.id = 'llmHelpToggle';
  llmToggle.checked = true;
  chrome.storage.sync.get(['llmHelpEnabled'], result => {
    if (typeof result.llmHelpEnabled === 'boolean') {
      llmToggle.checked = result.llmHelpEnabled;
    }
  });
  llmToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ llmHelpEnabled: llmToggle.checked });
  });
  llmLabel.appendChild(llmToggle);
  llmLabel.appendChild(document.createTextNode('Transcribe with LLM'));
  popupOptionsDiv.appendChild(llmLabel);
}

document.addEventListener('DOMContentLoaded', renderPopupOptions);
