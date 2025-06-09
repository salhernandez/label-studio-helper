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
});