(function () {
    let helperUI = null;
    let fullEntryList = [];
    let selectedIndex = -1;
  
    function createHelperUI(targetEl) {
      if (helperUI) helperUI.remove();
  
      helperUI = document.createElement('div');
      helperUI.style.position = 'absolute';
      helperUI.style.zIndex = 10000;
      helperUI.style.background = '#fff';
      helperUI.style.border = '1px solid #ccc';
      helperUI.style.borderRadius = '4px';
      helperUI.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      helperUI.style.padding = '6px';
      helperUI.style.display = 'flex';
      helperUI.style.flexDirection = 'column';
      helperUI.style.width = 'ch'; // Placeholder, replaced below
  
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type or select...';
      input.style.padding = '6px';
      input.style.width = '100%';
      input.style.color = 'black';
      helperUI.appendChild(input);

      // Add 'Do not save to list' checkbox below the input
      const dontSaveWrapper = document.createElement('label');
      dontSaveWrapper.style.display = 'flex';
      dontSaveWrapper.style.alignItems = 'center';
      dontSaveWrapper.style.margin = '4px 0 0 0';
      dontSaveWrapper.style.color = 'black';
      const dontSaveCheckbox = document.createElement('input');
      dontSaveCheckbox.type = 'checkbox';
      dontSaveCheckbox.style.marginRight = '6px';
      dontSaveWrapper.appendChild(dontSaveCheckbox);
      dontSaveWrapper.appendChild(document.createTextNode("Don't save to list"));
      // Insert the checkbox right after the input, before the list
      helperUI.appendChild(dontSaveWrapper);

      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.margin = 0;
      list.style.padding = '4px 0';
      list.style.maxHeight = '200px';
      list.style.minHeight = '160px';
      list.style.overflowY = 'auto';
      list.style.color = 'black';
      helperUI.style.width = `${30 * 8}px`; // ~30 characters assuming 8px average width
      helperUI.appendChild(list);

      // Request entries before API call and loading icon
      chrome.runtime.sendMessage({ type: 'getEntries' }, response => {
        fullEntryList = response.entries || [];
        updateList(list, fullEntryList, input, targetEl);
      });
  
      // Extract x, y, w, h from .lsf-region-editor
      let regionData = {};
      const regionEditor = document.querySelector('.lsf-region-editor');
      if (regionEditor) {
        const labels = regionEditor.querySelectorAll('.lsf-region-editor__property');
        labels.forEach(label => {
          const input = label.querySelector('input.lsf-region-editor__input');
          const span = label.querySelector('.lsf-region-editor__text');
          if (input && span) {
            const key = span.textContent.trim().toLowerCase();
            if (["x","y","w","h"].includes(key)) {
              regionData[key] = input.value;
            }
          }
        });
      }
      // Also grab the current task id
      const taskIdDiv = document.querySelector('.lsf-current-task__task-id');
      if (taskIdDiv) {
        regionData.taskNumber = taskIdDiv.textContent.trim();
      }
      console.log('Region Data:', regionData);
      // Request API data from background.js, sending regionData
      // Check if LLM Help is enabled before sending API request
      chrome.storage.sync.get(['llmHelpEnabled'], result => {
        if (result.llmHelpEnabled === false) {
          // LLM Help is disabled, skip API call
          input.style.backgroundImage = '';
          return;
        }
        // Show loading icon in input
        input.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg width=\'20\' height=\'20\' viewBox=\'0 0 50 50\' xmlns=\'http://www.w3.org/2000/svg\'><circle cx=\'25\' cy=\'25\' r=\'20\' fill=\'none\' stroke=\'%23007bff\' stroke-width=\'5\' stroke-dasharray=\'31.4 31.4\' transform=\'rotate(-90 25 25)\'><animateTransform attributeName=\'transform\' type=\'rotate\' from=\'0 25 25\' to=\'360 25 25\' dur=\'1s\' repeatCount=\'indefinite\'/></circle></svg>")';
        input.style.backgroundRepeat = 'no-repeat';
        input.style.backgroundPosition = 'right 8px center';
        input.style.backgroundSize = '20px 20px';
        chrome.runtime.sendMessage({ type: 'fetchApiData', region: regionData }, apiResponse => {
          // Remove loading icon
          input.style.backgroundImage = '';
          // Show toast if error
          if (apiResponse && apiResponse.error) {
            showWebToast(apiResponse.error, 'danger');
          }
          // Populate input placeholder with API response (stringified)
          if(apiResponse && apiResponse.transcription){
            input.placeholder = apiResponse.transcription;
            // If the transcription exists in the list, highlight/select it
            const items = list.querySelectorAll('li');
            let foundIndex = -1;
            items.forEach((li, idx) => {
              if (li.textContent.trim() === apiResponse.transcription) {
                foundIndex = idx;
              }
            });
            if (foundIndex !== -1) {
              selectedIndex = foundIndex;
              highlightItem(items);
              // Scroll the selected item to the top of the list
              if (items[selectedIndex]) {
                items[selectedIndex].scrollIntoView({ block: 'start' });
              }
            }
          }
          console.log('API Data:', apiResponse);
        });
      });
  
      input.addEventListener('input', () => {
        const search = input.value.trim().toLowerCase();
        // Use advanced filtering logic from options.js

        // Dupe
        function getFilteredEntries(entries, searchQuery) {
          if (!searchQuery.trim()) return entries;

          const directMatches = [];
          const partialMatches = [];

          const lowerQuery = searchQuery.toLowerCase();

          entries.forEach(entry => {
            const lowerEntry = entry.toLowerCase();

            if (lowerEntry === lowerQuery) {
              directMatches.push(entry);
            } else if (lowerEntry.includes(lowerQuery)) {
              partialMatches.push(entry);
            }
          });

          partialMatches.sort((a, b) => {
            const lenDiff = a.length - b.length;
            if (lenDiff !== 0) return lenDiff;

            const aIsLower = /^[a-z]/.test(a);
            const bIsLower = /^[a-z]/.test(b);
            if (aIsLower && !bIsLower) return -1;
            if (!aIsLower && bIsLower) return 1;

            return a.localeCompare(b);
          });

          return [...directMatches, ...partialMatches];
        }
        const filtered = getFilteredEntries(fullEntryList, input.value);
        updateList(list, filtered, input, targetEl);
      });
  
      input.addEventListener('keydown', e => {
        const items = list.querySelectorAll('li');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (items.length > 0) {
            selectedIndex = (selectedIndex + 1) % items.length;
            highlightItem(items);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (items.length > 0) {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            highlightItem(items);
          }
        } else if (e.key === 'Tab') {
          // If an option is selected, populate input with that option
          if (selectedIndex >= 0 && items[selectedIndex]) {
            e.preventDefault();
            const value = items[selectedIndex].textContent;
            insertIntoField(targetEl, value);
            helperUI.remove();
            helperUI = null;
            targetEl.focus();
          } else if (input.placeholder && (!items.length || selectedIndex === -1)) {
            // Only populate input with placeholder if there is a placeholder and no list selection
            e.preventDefault();
            input.value = input.placeholder;
            input.placeholder = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } else if (e.shiftKey && e.key === 'Tab') {
          // Do nothing (prevent navigation)
          e.preventDefault();
        } else if (e.key === 'Enter') {
          if (selectedIndex >= 0 && items[selectedIndex]) {
            const value = items[selectedIndex].textContent;
            insertIntoField(targetEl, value);
            helperUI.remove();
            helperUI = null;
            targetEl.focus();
          } else {
            const value = input.value.trim();
            if (!value) return;
            // Always retrieve entries, but only call setEntries if checkbox is NOT checked
            chrome.runtime.sendMessage({ type: 'getEntries' }, response => {
              const entries = response.entries || [];
              if (!dontSaveCheckbox.checked && !entries.includes(value)) {
                // Only call setEntries if not already present
                chrome.runtime.sendMessage({ type: 'setEntries', entries: entries.concat([value]) }, () => {
                  // Optionally handle response
                });
              }
              insertIntoField(targetEl, value);
              helperUI.remove();
              helperUI = null;
              targetEl.focus();
            });
          }
        } else if (e.key === 'Escape') {
          helperUI.remove();
          helperUI = null;
        }
      });
  
      const rect = targetEl.getBoundingClientRect();
      const helperHeight = 200; // estimate (input + 5 options)
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
  
      if (spaceAbove > helperHeight) {
        helperUI.style.top = `${window.scrollY + rect.top - helperHeight - 8}px`;
      } else {
        helperUI.style.top = `${window.scrollY + rect.bottom + 8}px`;
      }
  
      helperUI.style.left = `${window.scrollX + rect.left}px`;
  
      document.body.appendChild(helperUI);
      input.focus();
    }
  
    function highlightItem(items) {
      items.forEach((el, i) => {
        el.style.backgroundColor = i === selectedIndex ? '#def' : '';
        if (i === selectedIndex) {
          // Ensure the selected item is visible in the scrollable list
          el.scrollIntoView({ block: 'nearest' });
        }
      });
    }
  
    function updateList(list, entries, input, targetEl) {
      selectedIndex = -1;
      list.innerHTML = '';
      entries.forEach(text => addToListItem(text, list, input, targetEl));
    }
  
    function addToListItem(text, list, input, targetEl) {
      const li = document.createElement('li');
      li.textContent = text;
      li.style.padding = '5px';
      li.style.cursor = 'pointer';
      li.style.borderBottom = '1px solid #eee';
      li.addEventListener('click', () => {
        insertIntoField(targetEl, text);
        helperUI.remove();
        helperUI = null;
      });
      list.appendChild(li);
    }
  
    function insertIntoField(el, text) {
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  
    // Show a toast notification in the webpage
    function showWebToast(message, type = 'danger') {
      let toastContainer = document.getElementById('lshelper-toast-container');
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'lshelper-toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '30px';
        toastContainer.style.left = '50%';
        toastContainer.style.transform = 'translateX(-50%)';
        toastContainer.style.zIndex = '99999';
        document.body.appendChild(toastContainer);
      }
      const toast = document.createElement('div');
      toast.style.background = type === 'danger' ? '#dc3545' : '#28a745';
      toast.style.color = 'white';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '6px';
      toast.style.marginTop = '8px';
      toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      toast.style.fontSize = '1rem';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.flexDirection = 'column';
      toast.innerHTML = `
        <span style="font-size:0.85em;opacity:0.8;margin-bottom:2px;">Label Studio Helper</span>
        <div style="display:flex;align-items:center;width:100%">
          <span style="flex:1">${message}</span>
          <button style="background:none;border:none;color:white;font-size:1.2em;margin-left:12px;cursor:pointer">&times;</button>
        </div>
      `;
      toast.querySelector('button').onclick = () => toast.remove();
      toastContainer.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === '.') {
        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
          createHelperUI(active);
        }
      }
    });
  })();
