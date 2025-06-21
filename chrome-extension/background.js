chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    fetch('http://localhost:3000/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data
    })
      .then(response => response.json())
      .then(data => {
        console.log('API Data:', data);
        sendResponse(data);
      })
      .catch(error => {
        console.error('API Error:', error);
        sendResponse({ data: null, error: error.toString() });
      });
    return true; // Keep the message channel open for async response
  }
});