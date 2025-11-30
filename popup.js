document.addEventListener('DOMContentLoaded', () => {
  const keywordInput = document.getElementById('keywordInput');
  const addKeywordBtn = document.getElementById('addKeywordBtn');
  const keywordsList = document.getElementById('keywordsList');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const confirmModal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalOkBtn = document.getElementById('modalOkBtn');
  const filterToggle = document.getElementById('filterToggle');

  function loadFilterState() {
    chrome.storage.sync.get(['filterEnabled'], (result) => {
      const isEnabled = result.filterEnabled !== false; // Default to true
      filterToggle.checked = isEnabled;
    });
  }

  function toggleFilter() {
    const isEnabled = filterToggle.checked;
    chrome.storage.sync.set({ filterEnabled: isEnabled }, () => {
      const message = isEnabled 
        ? 'Filter has been enabled. Jobs matching keywords will be blurred.' 
        : 'Filter has been disabled. All jobs will be visible.';
      showModal(isEnabled ? 'Filter Enabled' : 'Filter Disabled', message);
      setTimeout(() => {
        refreshLinkedInPage();
      }, 1500);
    });
  }

  function loadKeywords() {
    chrome.storage.sync.get(['jobFilterKeywords'], (result) => {
      const keywords = result.jobFilterKeywords || [];
      displayKeywords(keywords);
    });
  }

  // Display keywords in the list
  function displayKeywords(keywords) {
    keywordsList.innerHTML = '';

    if (keywords.length === 0) {
      keywordsList.innerHTML = '<p class="empty-state">No keywords added yet</p>';
      return;
    }

    keywords.forEach((keyword, index) => {
      const keywordItem = document.createElement('div');
      keywordItem.className = 'keyword-item';
      keywordItem.innerHTML = `
        <span class="keyword-text">${escapeHtml(keyword)}</span>
        <button class="btn btn-danger" data-index="${index}">Remove</button>
      `;
      keywordsList.appendChild(keywordItem);
    });

    keywordsList.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        removeKeyword(index);
      });
    });
  }

  function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmModal.classList.add('show');
  }

  function hideModal() {
    confirmModal.classList.remove('show');
  }

  function refreshLinkedInPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com/jobs')) {
        chrome.tabs.reload(tabs[0].id, () => {
          setTimeout(() => {
            window.close();
          }, 500);
        });
      } else {
        hideModal();
      }
    });
  }

  function addKeyword() {
    const keyword = keywordInput.value.trim();
    
    if (!keyword) {
      alert('Please enter a keyword');
      return;
    }

    chrome.storage.sync.get(['jobFilterKeywords'], (result) => {
      const keywords = result.jobFilterKeywords || [];
      
      if (keywords.includes(keyword)) {
        alert('This keyword is already in the list');
        return;
      }

      keywords.push(keyword);
      chrome.storage.sync.set({ jobFilterKeywords: keywords }, () => {
        keywordInput.value = '';
        loadKeywords();
        showModal('Keyword Added', `"${keyword}" has been added to your filter list.`);
        setTimeout(() => {
          refreshLinkedInPage();
        }, 1500);
      });
    });
  }

  function removeKeyword(index) {
    chrome.storage.sync.get(['jobFilterKeywords'], (result) => {
      const keywords = result.jobFilterKeywords || [];
      const removedKeyword = keywords[index];
      keywords.splice(index, 1);
      chrome.storage.sync.set({ jobFilterKeywords: keywords }, () => {
        loadKeywords();
        showModal('Keyword Removed', `"${removedKeyword}" has been removed from your filter list.`);
        setTimeout(() => {
          refreshLinkedInPage();
        }, 1500);
      });
    });
  }

  function clearAllKeywords() {
    if (confirm('Are you sure you want to clear all keywords?')) {
      chrome.storage.sync.set({ jobFilterKeywords: [] }, () => {
        loadKeywords();
        showModal('All Keywords Cleared', 'All filter keywords have been removed.');
        setTimeout(() => {
          refreshLinkedInPage();
        }, 1500);
      });
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addKeywordBtn.addEventListener('click', addKeyword);
  
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });

  clearAllBtn.addEventListener('click', clearAllKeywords);

  modalOkBtn.addEventListener('click', () => {
    refreshLinkedInPage();
  });

  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      refreshLinkedInPage();
    }
  });

  filterToggle.addEventListener('change', toggleFilter);

  loadFilterState();
  loadKeywords();
});

