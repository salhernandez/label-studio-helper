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
    // Dummy API request (replace with real API as needed)
    fetch('https://jsonplaceholder.typicode.com/todos/1')
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