/**
 * Type Nepali Popup Script
 * Handles popup UI interactions, site permissions, and toggle functionality.
 * @version 1.6.0
 */

'use strict';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Firefox MV3 treats manifest host_permissions as optional — they must be
// granted at runtime or the browser shows a "permission needed" dot on the icon.
const ALL_URLS_ORIGIN = '<all_urls>';

const elements = {
  button: null,
  statusSpan: null,
  btnText: null,
  permissionBanner: null,
  grantBtn: null
};

let isEnabled = false;

let hasPermission = true;

async function init() {
  elements.button = document.getElementById('btn');
  elements.statusSpan = document.getElementById('span-btn');
  elements.btnText = elements.button?.querySelector('.btn-text');
  elements.permissionBanner = document.getElementById('permission-banner');
  elements.grantBtn = document.getElementById('grant-btn');

  if (!elements.button) {
    return;
  }

  await checkPermissions();
  await loadState();

  elements.button.addEventListener('click', toggleState);
  elements.grantBtn?.addEventListener('click', grantPermission);

  browserAPI.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.translateText) {
      const newState = changes.translateText.newValue;

      if (newState !== isEnabled) {
        isEnabled = newState;
        updateUI(newState);
      }
    }
  });
}

/**
 * Check whether the extension already has site access (<all_urls>).
 * Chrome grants it automatically at install; Firefox requires an explicit grant.
 */
async function checkPermissions() {
  try {
    hasPermission = await browserAPI.permissions.contains({ origins: [ALL_URLS_ORIGIN] });
  } catch (error) {
    hasPermission = true; // Assume granted if the API is unavailable
  }

  updatePermissionUI();
}

/**
 * Ask the user to grant site access. Must run inside a user-gesture handler.
 * Once granted, Firefox removes the "permission needed" dot from the icon.
 */
async function grantPermission() {
  try {
    const granted = await browserAPI.permissions.request({ origins: [ALL_URLS_ORIGIN] });

    if (granted) {
      hasPermission = true;
      updatePermissionUI();

      // Content scripts declared in the manifest are not injected into pages
      // that were opened *before* the permission was granted — inject them now.
      await injectContentScripts();
    }
  } catch (error) {
    // User dismissed the prompt or the API is unavailable
  }
}

/**
 * Inject the content script into all open http/https tabs.
 */
async function injectContentScripts() {
  if (!browserAPI.scripting) {
    return;
  }

  try {
    const tabs = await browserAPI.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    for (const tab of tabs) {
      try {
        await browserAPI.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['scripts/content.js']
        });
      } catch (_) {
        // Restricted pages can't be injected — ignore
      }
    }
  } catch (error) {
    // Ignore query errors
  }
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

  // If enabling without site access, request the permission first
  if (newState && !hasPermission) {
    await grantPermission();

    if (!hasPermission) {
      return; // Permission denied — stay off
    }
  }

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
 * Show or hide the permission banner.
 */
function updatePermissionUI() {
  if (!elements.permissionBanner) {
    return;
  }

  elements.permissionBanner.classList.toggle('hidden', hasPermission);
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