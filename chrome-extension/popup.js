// Render the LLM Help toggle in the popup
function renderPopupOptions() {
  const popupOptionsDiv = document.getElementById('popupOptions');
  popupOptionsDiv.innerHTML = '';

  // LLM API status indicator
  chrome.runtime.sendMessage({ type: 'getApiStatus' }, response => {
    const statusRow = document.createElement('div');
    statusRow.className = 'd-flex align-items-center gap-2 mb-2';
    const circle = document.createElement('span');
    circle.style.display = 'inline-block';
    circle.style.width = '12px';
    circle.style.height = '12px';
    circle.style.borderRadius = '50%';
    circle.style.background = response && response.status ? '#28a745' : '#dc3545';
    statusRow.appendChild(circle);
    const label = document.createElement('span');
    label.textContent = 'LLM API';
    statusRow.appendChild(label);
    popupOptionsDiv.appendChild(statusRow);

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
  });
}

document.addEventListener('DOMContentLoaded', renderPopupOptions);
