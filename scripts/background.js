/**
 * Type Nepali Background Script
 * Handles keyboard shortcuts and global state management.
 * @version 1.5.1
 */

'use strict';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

/**
 * Get current translation state from storage.
 * @returns {Promise<boolean>}
 */
async function getCurrentState() {
  try {
    const result = await browserAPI.storage.sync.get(['translateText']);

    return result.translateText || false;
  } catch (error) {
    return false;
  }
}

/**
 * Send toggle message to active tabs only (avoids useless broadcasts).
 * @param {boolean} newState
 */
async function broadcastToTabs(newState) {
  try {
    const tabs = await browserAPI.tabs.query({ url: ['http://*/*', 'https://*/*'] });

    for (const tab of tabs) {
      try {
        await browserAPI.tabs.sendMessage(tab.id, { translate: newState });
      } catch (_) {
        // Tab may not have content script loaded — silently ignore
      }
    }
  } catch (error) {
    // Ignore broadcast errors
  }
}

/**
 * Handle keyboard command.
 * @param {string} command
 */
async function handleCommand(command) {
  if (command !== 'toggle-feature') {
    return;
  }

  try {
    const currentState = await getCurrentState();
    const newState = !currentState;

    await browserAPI.storage.sync.set({ translateText: newState });
    await broadcastToTabs(newState);
  } catch (error) {
    // Ignore command handler errors
  }
}

// Listen for keyboard commands
browserAPI.commands.onCommand.addListener(handleCommand);

// Listen for state requests from popup
browserAPI.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GET_STATE') {
    getCurrentState().then(state => sendResponse({ state }));

    return true; // Keep channel open for async response
  }

  return false;
});