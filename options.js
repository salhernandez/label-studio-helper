let entries = [];
let searchQuery = '';

function getFilteredEntries() {
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


function renderEntries() {
  const entryList = document.getElementById('entryList');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  entryList.innerHTML = '';

  const filteredEntries = getFilteredEntries();

  filteredEntries.forEach((entry, indexInFiltered) => {
    const indexInOriginal = entries.indexOf(entry);

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'form-check d-flex align-items-center gap-2';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    checkbox.dataset.index = indexInOriginal;
    checkbox.addEventListener('change', toggleBulkDeleteButton);

    const label = document.createElement('label');
    label.textContent = entry;

    leftGroup.appendChild(checkbox);
    leftGroup.appendChild(label);
    li.appendChild(leftGroup);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group btn-group-sm';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline-secondary';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
      const newWord = prompt('Edit word:', entry);
      if (newWord && newWord.trim() !== '') {
        entries[indexInOriginal] = newWord.trim();
        saveEntries();
      }
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      entries.splice(indexInOriginal, 1);
      saveEntries();
    };

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);
    li.appendChild(btnGroup);

    entryList.appendChild(li);
  });

  toggleBulkDeleteButton();
}

function saveEntries() {
  chrome.runtime.sendMessage({ type: 'setEntries', entries }, response => {
    if (response.success) {
      renderEntries();
    }
  });
}

function toggleBulkDeleteButton() {
  const checkboxes = document.querySelectorAll('#entryList input[type="checkbox"]');
  const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
  document.getElementById('bulkDeleteBtn').classList.toggle('d-none', !anyChecked);
}

function deleteSelectedEntries() {
  const checkboxes = document.querySelectorAll('#entryList input[type="checkbox"]');
  const indexesToDelete = [];

  checkboxes.forEach(cb => {
    if (cb.checked) {
      indexesToDelete.push(parseInt(cb.dataset.index));
    }
  });

  indexesToDelete.sort((a, b) => b - a).forEach(i => entries.splice(i, 1));
  saveEntries();
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ type: 'getEntries' }, response => {
    entries = response.entries || [];
    renderEntries();
  });

  document.getElementById('addForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('newEntry');
    const newWord = input.value.trim();
    if (newWord) {
      entries.push(newWord);
      input.value = '';
      saveEntries();
    }
  });

  document.getElementById('bulkDeleteBtn').addEventListener('click', deleteSelectedEntries);

  document.getElementById('searchBox').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderEntries();
  });
});
