/**
 * Type Nepali Popup Script
 * Handles popup UI interactions and toggle functionality.
 * @version 1.5.1
 */

'use strict';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

const elements = {
  button: null,
  statusSpan: null,
  btnText: null
};

let isEnabled = false;

async function init() {
  elements.button = document.getElementById('btn');
  elements.statusSpan = document.getElementById('span-btn');
  elements.btnText = elements.button?.querySelector('.btn-text');

  if (!elements.button) {
    return;
  }

  await loadState();
  elements.button.addEventListener('click', toggleState);



  browserAPI.storage.onChanged.addListener((changes, areaName) => {
    // Listen for storage changes to update UI when changed elsewhere (e.g., via shortcut)
    if (areaName === 'sync' && changes.translateText) {
      const newState = changes.translateText.newValue;

      // Only update if the state has actually changed
      if (newState !== isEnabled) {
        isEnabled = newState;
        updateUI(newState);
      }
    }
  });
}

async function loadState() {
  try {
    const result = await browserAPI.storage.sync.get(['translateText']);

    isEnabled = result.translateText || false;
    updateUI(isEnabled);
  } catch (error) {
    // Silently ignore storage errors
    updateUI(false);
  }
}

async function toggleState() {
  const newState = !isEnabled;

  // Instant visual feedback
  updateUI(newState);
  isEnabled = newState;

  try {
    await browserAPI.storage.sync.set({ translateText: newState });

    // Only notify http/https tabs (skip system chrome://, about://, moz-extension://)
    const tabs = await browserAPI.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, { translate: newState });
      } catch (_) {
        // Tab may not have content script loaded
      }
    }
  } catch (error) {
    // Revert UI on error
    updateUI(!newState);
    isEnabled = !newState;
  }
}

/**
 * Update UI to reflect the current enabled state.
 * @param {boolean} enabled
 */
function updateUI(enabled) {
  if (!elements.button || !elements.statusSpan) {
    return;
  }

  if (elements.btnText) {
    elements.btnText.textContent = enabled ? 'On' : 'Off';
  }

  elements.button.classList.toggle('off', !enabled);
  elements.statusSpan.textContent = enabled ? 'Active' : 'Inactive';
  elements.statusSpan.className = `status-indicator ${enabled ? 'status-on' : 'status-off'}`;
  elements.button.setAttribute('aria-pressed', enabled.toString());
}

document.addEventListener('DOMContentLoaded', init);