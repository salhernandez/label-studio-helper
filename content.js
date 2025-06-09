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
  
      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.margin = 0;
      list.style.padding = '4px 0';
      list.style.maxHeight = '200px';
      list.style.minHeight = '160px';
      list.style.overflowY = 'auto';
      list.style.color = 'black';
      helperUI.style.width = `${20 * 8}px`; // ~20 characters assuming 8px average width
      helperUI.appendChild(list);

      chrome.runtime.sendMessage({ type: 'getEntries' }, response => {
        fullEntryList = response.entries || [];
        updateList(list, fullEntryList, input, targetEl);
      });
  
      input.addEventListener('input', () => {
        const search = input.value.trim().toLowerCase();
        const filtered = fullEntryList.filter(e => e.toLowerCase().includes(search));
        updateList(list, filtered, input, targetEl);
      });
  
      input.addEventListener('keydown', e => {
        const items = list.querySelectorAll('li');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % items.length;
          highlightItem(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          highlightItem(items);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % items.length;
          highlightItem(items);
        } else if (e.shiftKey && e.key === 'Tab') {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          highlightItem(items);
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
            chrome.runtime.sendMessage({ type: 'getEntries' }, response => {
              const entries = response.entries || [];
              if (!entries.includes(value)) {
                entries.unshift(value);
                chrome.runtime.sendMessage({ type: 'setEntries', entries }, () => {
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
  
    window.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === '.') {
        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
          createHelperUI(active);
        }
      }
    });
  })();
