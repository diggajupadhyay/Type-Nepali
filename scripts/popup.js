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
  statusSpan: null
};

// State
let isEnabled = false;

/**
 * Initialize popup UI
 */
async function init() {
  // Cache DOM elements
  elements.button = document.getElementById('btn');
  elements.statusSpan = document.getElementById('span-btn');
  
  if (!elements.button) {
    console.error('[Type-Nepali] Button element not found');

    return;
  }
  
  // Load current state
  await loadState();
  
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
  
  try {
    // Get all tabs
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
    
    // Update storage
    await browserAPI.storage.sync.set({ translateText: newState });
    
    // Update UI
    updateUI(newState);
    isEnabled = newState;
    
    console.log('[Type-Nepali] Toggled to:', newState ? 'ON' : 'OFF');
  } catch (error) {
    console.error('[Type-Nepali] Toggle failed:', error);
  }
}

/**
 * Update UI based on state
 * @param {boolean} enabled - Whether translation is enabled
 */
function updateUI(enabled) {
  if (!elements.button || !elements.statusSpan) {return;}
  
  isEnabled = enabled;
  elements.button.textContent = enabled ? 'On' : 'Off';
  elements.button.classList.toggle('off', !enabled);
  elements.statusSpan.textContent = enabled ? 'On' : 'Off';
  elements.statusSpan.className = enabled ? 'status-on' : 'status-off';
  
  // Update ARIA label
  elements.button.setAttribute('aria-pressed', enabled.toString());
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
