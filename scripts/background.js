/**
 * Type Nepali Background Script
 * Handles keyboard shortcuts and global state management
 * @version 1.5.0
 */

'use strict';

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

/**
 * Get current translation state from storage
 * @returns {Promise<boolean>} Current state
 */
async function getCurrentState() {
  try {
    const result = await browserAPI.storage.sync.get(['translateText']);

    return result.translateText || false;
  } catch (error) {
    console.error('[Type-Nepali] Failed to get state:', error);

    return false;
  }
}

/**
 * Send toggle message to all tabs
 * @param {boolean} newState - New translation state
 */
async function broadcastToTabs(newState) {
  try {
    const tabs = await browserAPI.tabs.query({});
    
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
  } catch (error) {
    console.error('[Type-Nepali] Broadcast failed:', error);
  }
}

/**
 * Handle keyboard command
 * @param {string} command - Command name
 */
async function handleCommand(command) {
  if (command !== 'toggle-feature') {return;}
  
  try {
    const currentState = await getCurrentState();
    const newState = !currentState;
    
    // Update storage
    await browserAPI.storage.sync.set({ translateText: newState });
    
    // Broadcast to all tabs
    await broadcastToTabs(newState);
    
    console.log('[Type-Nepali] Toggled via shortcut:', newState ? 'ON' : 'OFF');
  } catch (error) {
    console.error('[Type-Nepali] Command handler error:', error);
  }
}

// Listen for keyboard commands
browserAPI.commands.onCommand.addListener(handleCommand);

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATE') {
    getCurrentState().then(state => sendResponse({ state }));

    return true; // Keep channel open for async response
  }

  return false;
});

console.log('[Type-Nepali] Background script loaded');
