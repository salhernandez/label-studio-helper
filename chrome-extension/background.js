// Track LLM API status
let llmApiStatus = false;

function checkLlmApiStatus() {
  return fetch('http://localhost:3000/status')
    .then(resp => resp.ok)
    .catch(() => false);
}

// Periodically update status every 10 seconds
setInterval(async () => {
  llmApiStatus = await checkLlmApiStatus();
}, 10000);

// Initial status check
checkLlmApiStatus().then(status => { llmApiStatus = status; });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getApiStatus') {
    sendResponse({ status: llmApiStatus });
    return true;
  }
  if (message.type === 'getEntries') {
    chrome.storage.local.get(['entries'], result => {
      sendResponse({ entries: result.entries || [] });
    });
    return true; // Keep the message channel open for async response
  }
  if (message.type === 'setEntries') {
    chrome.storage.local.set({ entries: message.entries }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.type === 'fetchApiData') {
    (async () => {
      try {
        // Check /status endpoint before calling /transcribe
        const statusResp = await fetch('http://localhost:3000/status');
        if (!statusResp.ok) {
          sendResponse({ data: null, error: 'API /status check failed' });
          return;
        }
        // Use fetch to POST to the API with region data from the message
        const region = message.region || {};
        let data = JSON.stringify({
          taskNumber: parseFloat(region.taskNumber),
          x: parseFloat(region.x),
          y: parseFloat(region.y),
          width: parseFloat(region.w),
          height: parseFloat(region.h)
        });
        console.log('Sending data to API:', data);
        const response = await fetch('http://localhost:3000/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: data
        });
        const result = await response.json();
        sendResponse(result);
      } catch (error) {
        // Do not log fetch errors to the console
        sendResponse({ data: null, error: 'API unavailable or error occurred.' });
      }
    })();
    return true; // Keep the message channel open for async response
  }
});