/**
 * Type Nepali Popup Script
 * Handles popup UI interactions and toggle functionality
 * @version 1.5.0
 */

'use strict';

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// DOM Elements
const elements = {
  button: null,
  statusSpan: null,
  quickWords: null,
  quickCache: null,
  btnText: null
};

// State
let isEnabled = false;
let stats = { wordsTranslated: 0, cacheHits: 0 };

/**
 * Initialize popup UI
 */
async function init() {
  // Cache DOM elements
  elements.button = document.getElementById('btn');
  elements.statusSpan = document.getElementById('span-btn');
  elements.quickWords = document.getElementById('quick-words');
  elements.quickCache = document.getElementById('quick-cache');
  elements.btnText = elements.button?.querySelector('.btn-text');

  if (!elements.button) {
    console.error('[Type-Nepali] Button element not found');

    return;
  }

  // Load current state and stats
  await loadState();
  await loadStats();

  // Setup event listeners
  elements.button.addEventListener('click', toggleState);

  // Listen for state changes from other parts of extension
  browserAPI.runtime.onMessage.addListener((request) => {
    if (typeof request.translate === 'boolean') {
      updateUI(request.translate);
    }

    return true;
  });
}

/**
 * Load statistics from storage
 */
async function loadStats() {
  try {
    const result = await browserAPI.storage.sync.get(['stats']);
    
    if (result.stats) {
      stats = result.stats;
    }
    
    updateStatsUI();
  } catch (error) {
    console.error('[Type-Nepali] Failed to load stats:', error);
  }
}

/**
 * Update statistics display
 */
function updateStatsUI() {
  if (elements.quickWords) {
    elements.quickWords.textContent = stats.wordsTranslated || 0;
  }
  if (elements.quickCache) {
    elements.quickCache.textContent = stats.cacheHits || 0;
  }
}

/**
 * Load translation state from storage
 */
async function loadState() {
  try {
    const result = await browserAPI.storage.sync.get(['translateText']);

    isEnabled = result.translateText || false;
    updateUI(isEnabled);
  } catch (error) {
    console.error('[Type-Nepali] Failed to load state:', error);
    updateUI(false);
  }
}

/**
 * Toggle translation state
 */
async function toggleState() {
  const newState = !isEnabled;

  // Update UI immediately (synchronous) for instant visual feedback
  updateUI(newState);
  isEnabled = newState;

  // Handle async operations in background
  try {
    // Update storage first
    await browserAPI.storage.sync.set({ translateText: newState });

    // Get all tabs and send message
    const tabs = await browserAPI.tabs.query({});

    // Send message to each tab
    for (const tab of tabs) {
      // Skip system tabs
      if (/^(chrome|about|moz-extension):\/\//.test(tab.url)) {
        continue;
      }

      try {
        await browserAPI.tabs.sendMessage(tab.id, { translate: newState });
      } catch (error) {
        // Tab may not have content script loaded - silently ignore
      }
    }

    console.log('[Type-Nepali] Toggled to:', newState ? 'ON' : 'OFF');
  } catch (error) {
    console.error('[Type-Nepali] Toggle failed:', error);
    // Revert UI on error
    updateUI(!newState);
    isEnabled = !newState;
  }
}

/**
 * Update UI based on state
 * @param {boolean} enabled - Whether translation is enabled
 */
function updateUI(enabled) {
  if (!elements.button || !elements.statusSpan) {return;}

  isEnabled = enabled;
  
  // Update button text only (preserve icon)
  if (elements.btnText) {
    elements.btnText.textContent = enabled ? 'On' : 'Off';
  }
  
  // Update button state class
  elements.button.classList.toggle('off', !enabled);
  
  // Update status span
  elements.statusSpan.textContent = enabled ? 'On' : 'Off';
  elements.statusSpan.className = `status-indicator ${enabled ? 'status-on' : 'status-off'}`;

  // Update ARIA label
  elements.button.setAttribute('aria-pressed', enabled.toString());
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
