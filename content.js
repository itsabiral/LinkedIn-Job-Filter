(function() {
  'use strict';

  let keywords = [];
  let observer = null;
  let filterEnabled = true;

  function loadFilterState() {
    chrome.storage.sync.get(['filterEnabled', 'jobFilterKeywords'], (result) => {
      filterEnabled = result.filterEnabled !== false; // Default to true
      keywords = result.jobFilterKeywords || [];
      filterJobs();
    });
  }

  function loadKeywords() {
    loadFilterState();
  }

  // Check job text contains any keyword
  function containsKeyword(text) {
    if (!keywords || keywords.length === 0) return false;
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase().trim();
      return lowerKeyword && lowerText.includes(lowerKeyword);
    });
  }

  // Blur jobs that matches the keywords
  function filterJobs() {
    if (!filterEnabled) { // check if filter is enabled
      const blurredCards = document.querySelectorAll('[data-linkedin-filter-blurred]');
      blurredCards.forEach(card => {
        card.removeAttribute('data-linkedin-filter-blurred');
        card.style.filter = '';
        card.style.opacity = '';
        card.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
      });
      return;
    }

    // Select job cards 
    const jobSelectors = [
      'div[data-job-id]',
      'li.jobs-search-results__list-item',
      'div.job-card-container',
      'div[data-entity-urn*="jobPosting"]',
      'div.job-card-list__entity-lockup'
    ];

    let jobsBlurred = 0;

    jobSelectors.forEach(selector => {
      const jobCards = document.querySelectorAll(selector);
      jobCards.forEach(card => {
        const jobText = card.innerText || card.textContent || '';
        const shouldBlur = containsKeyword(jobText);
        
        if (shouldBlur) {
          if (!card.hasAttribute('data-linkedin-filter-blurred')) {
            card.setAttribute('data-linkedin-filter-blurred', 'true');
            card.style.filter = 'blur(4px)';
            card.style.opacity = '0.5';
            card.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
            card.style.pointerEvents = 'auto'; 
            card.style.cursor = 'pointer';
            jobsBlurred++;
          }
        } else {
          if (card.hasAttribute('data-linkedin-filter-blurred')) {
            card.removeAttribute('data-linkedin-filter-blurred');
            card.style.filter = '';
            card.style.opacity = '';
            card.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
          }
        }
      });
    });

    const jobTitles = document.querySelectorAll('a[data-control-name="job_card_title"], a.job-card-list__title, h3.job-card-search__title');
    jobTitles.forEach(title => {
      const card = title.closest('div[data-job-id], li.jobs-search-results__list-item, div.job-card-container');
      if (card) {
        const jobText = card.innerText || card.textContent || '';
        const shouldBlur = containsKeyword(jobText);
        
        if (shouldBlur) {
          if (!card.hasAttribute('data-linkedin-filter-blurred')) {
            card.setAttribute('data-linkedin-filter-blurred', 'true');
            card.style.filter = 'blur(4px)';
            card.style.opacity = '0.5';
            card.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
            card.style.pointerEvents = 'auto';
            card.style.cursor = 'pointer';
            jobsBlurred++;
          }
        } else {
          if (card.hasAttribute('data-linkedin-filter-blurred')) {
            card.removeAttribute('data-linkedin-filter-blurred');
            card.style.filter = '';
            card.style.opacity = '';
            card.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
          }
        }
      }
    });
  }

  // DOM changes 
  function observeChanges() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      let shouldFilter = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          shouldFilter = true;
        }
      });
      if (shouldFilter) {
        setTimeout(filterJobs, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  function init() {
    loadFilterState();
    observeChanges();
    
    setTimeout(filterJobs, 1000);
    
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        if (changes.jobFilterKeywords) {
          keywords = changes.jobFilterKeywords.newValue || [];
        }
        if (changes.filterEnabled !== undefined) {
          filterEnabled = changes.filterEnabled.newValue !== false;
        }
        filterJobs();
      }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'refresh') {
        loadKeywords();
        sendResponse({ success: true });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

