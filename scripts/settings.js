/**
 * Type Nepali Settings Script
 * Handles settings page functionality and user preferences
 * @version 1.5.0
 */

'use strict';

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Default settings
const DEFAULT_SETTINGS = Object.freeze({
  autoConvert: true,
  convertPunctuation: true,
  fontSize: '14',
  fontFamily: 'default',
  stats: {
    wordsTranslated: 0,
    cacheHits: 0
  }
});

// Current settings state
let settings = { ...DEFAULT_SETTINGS };

// DOM Elements cache
const elements = {};

/**
 * Initialize settings page
 */
async function init() {
  cacheElements();
  await loadSettings();
  setupEventListeners();
  detectMacOS();
  updateStatsDisplay();
}

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  elements.autoConvert = document.getElementById('autoConvert');
  elements.convertPunctuation = document.getElementById('convertPunctuation');
  elements.fontSize = document.getElementById('fontSize');
  elements.fontFamily = document.getElementById('fontFamily');
  elements.wordsTranslated = document.getElementById('wordsTranslated');
  elements.cacheHits = document.getElementById('cacheHits');
  elements.saveSettings = document.getElementById('saveSettings');
  elements.resetStats = document.getElementById('resetStats');
  elements.resetSettings = document.getElementById('resetSettings');
  elements.saveMessage = document.getElementById('saveMessage');
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await browserAPI.storage.sync.get(Object.keys(DEFAULT_SETTINGS));

    settings = { ...DEFAULT_SETTINGS, ...result };
    populateUI();
  } catch (error) {
    console.error('[Type-Nepali] Failed to load settings:', error);
    settings = { ...DEFAULT_SETTINGS };
    populateUI();
  }
}

/**
 * Populate UI with current settings
 */
function populateUI() {
  if (elements.autoConvert) {elements.autoConvert.checked = settings.autoConvert;}
  if (elements.convertPunctuation) {elements.convertPunctuation.checked = settings.convertPunctuation;}
  if (elements.fontSize) {elements.fontSize.value = settings.fontSize;}
  if (elements.fontFamily) {elements.fontFamily.value = settings.fontFamily;}
}

/**
 * Update stats display
 */
function updateStatsDisplay() {
  if (elements.wordsTranslated && settings.stats) {
    elements.wordsTranslated.textContent = settings.stats.wordsTranslated || 0;
  }
  if (elements.cacheHits && settings.stats) {
    elements.cacheHits.textContent = settings.stats.cacheHits || 0;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  elements.saveSettings?.addEventListener('click', saveSettings);
  elements.resetStats?.addEventListener('click', resetStats);
  elements.resetSettings?.addEventListener('click', resetAllSettings);
  
  // Keyboard shortcut: Ctrl/Cmd + S to save
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveSettings();
    }
  });
}

/**
 * Detect macOS for shortcut display
 */
function detectMacOS() {
  const macHint = document.querySelector('.mac-hint');

  if (macHint && navigator.platform.includes('Mac')) {
    macHint.style.display = 'inline';
  }
}

/**
 * Save current settings
 */
async function saveSettings() {
  try {
    const newSettings = {
      autoConvert: elements.autoConvert?.checked ?? settings.autoConvert,
      convertPunctuation: elements.convertPunctuation?.checked ?? settings.convertPunctuation,
      fontSize: elements.fontSize?.value ?? settings.fontSize,
      fontFamily: elements.fontFamily?.value ?? settings.fontFamily,
      stats: settings.stats // Preserve stats
    };
    
    await browserAPI.storage.sync.set(newSettings);
    settings = newSettings;
    
    showSaveMessage('Settings saved successfully!', 'success');
    
    // Notify other parts of extension
    browserAPI.runtime.sendMessage({ 
      type: 'SETTINGS_UPDATED', 
      settings: newSettings 
    }).catch(() => {}); // Ignore if no listener
  } catch (error) {
    console.error('[Type-Nepali] Failed to save settings:', error);
    showSaveMessage('Error saving settings!', 'error');
  }
}

/**
 * Reset statistics to zero
 */
async function resetStats() {
  if (!confirm('Are you sure you want to reset all statistics?')) {
    return;
  }
  
  try {
    settings.stats = { wordsTranslated: 0, cacheHits: 0 };
    await browserAPI.storage.sync.set({ stats: settings.stats });
    updateStatsDisplay();
    showSaveMessage('Statistics reset!', 'success');
  } catch (error) {
    console.error('[Type-Nepali] Failed to reset stats:', error);
    showSaveMessage('Error resetting statistics!', 'error');
  }
}

/**
 * Reset all settings to defaults
 */
async function resetAllSettings() {
  if (!confirm('Are you sure you want to reset all settings to default?')) {
    return;
  }
  
  try {
    await browserAPI.storage.sync.clear();
    settings = { ...DEFAULT_SETTINGS };
    populateUI();
    updateStatsDisplay();
    showSaveMessage('All settings reset to default!', 'success');
    
    browserAPI.runtime.sendMessage({ 
      type: 'SETTINGS_UPDATED', 
      settings 
    }).catch(() => {});
  } catch (error) {
    console.error('[Type-Nepali] Failed to reset settings:', error);
    showSaveMessage('Error resetting settings!', 'error');
  }
}

/**
 * Show save confirmation message
 * @param {string} message - Message to display
 * @param {'success'|'error'} type - Message type
 */
function showSaveMessage(message, type) {
  if (!elements.saveMessage) {return;}
  
  elements.saveMessage.textContent = message;
  elements.saveMessage.className = `save-message ${type}`;
  
  setTimeout(() => {
    elements.saveMessage.textContent = '';
    elements.saveMessage.className = 'save-message';
  }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
