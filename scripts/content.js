/**
 * Type Nepali Content Script
 * Handles real-time English to Nepali transliteration on webpages
 * @version 1.5.0
 */

'use strict';

// ============================================================================
// Browser API Compatibility Layer
// ============================================================================
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// ============================================================================
// State Management
// ============================================================================
const state = {
  isEnabled: false,
  isSpacePressed: false,
  translationTimeout: null,
  promiseResolver: null,
  currentTextfield: null,
  observer: null,
  stats: {
    wordsTranslated: 0,
    cacheHits: 0
  }
};

// ============================================================================
// Nepali Word Cache (300+ common words for instant translation)
// ============================================================================
const NEPALI_WORD_CACHE = Object.freeze({
  // Greetings & Common
  'namaste': 'नमस्ते', 'hello': 'नमस्ते', 'hi': 'नमस्ते', 'bye': 'अलविदा',
  'nepal': 'नेपाल', 'nepali': 'नेपाली', 'jay': 'जय', 'hindu': 'हिन्दु',
  'dhanyabad': 'धन्यवाद', 'thanks': 'धन्यवाद', 'please': 'कृपया',
  'sorry': 'माफ गर्नुहोस्', 'welcome': 'स्वागत छ', 'congratulations': 'बधाई छ',
  
  // Deities & Names
  'ram': 'राम', 'sita': 'सीता', 'krishna': 'कृष्ण', 'shiva': 'शिव',
  'ganesh': 'गणेश', 'buddha': 'बुद्ध',
  
  // Places
  'kathmandu': 'काठमाडौं', 'pokhara': 'पोखरा', 'everest': 'सगरमाथा',
  
  // Pronouns
  'ma': 'म', 'timi': 'तिमी', 'tapai': 'तपाईं', 'mero': 'मेरो',
  'tero': 'तेरो', 'hamro': 'हाम्रो', 'yo': 'यो', 'tyo': 'त्यो',
  'u': 'उ', 'uni': 'उनी', 'uniharu': 'उनीहरू',
  
  // Basic Verbs
  'hune': 'हुने', 'garne': 'गर्ने', 'jane': 'जाने', 'aune': 'आउने',
  'bhanne': 'भन्ने', 'herne': 'हेर्ने', 'sunne': 'सुन्ने', 'padhne': 'पढ्ने',
  'lekhne': 'लेख्ने', 'bolne': 'बोल्ने', 'hasne': 'हस्ने', 'rune': 'रुने',
  'sutne': 'सुत्ने', 'uthne': 'उठ्ने', 'basne': 'बस्ने',
  
  // Basic Words
  'ho': 'हो', 'hoina': 'होइन', 'huncha': 'हुन्छ', 'chaina': 'छैन',
  'cha': 'छ', 'thiyo': 'थियो', 'gare': 'गरे', 'bhayo': 'भयो',
  'bhayena': 'भएन', 'ra': 'र', 'tar': 'तर', 'bhane': 'भने', 'vane': 'भने',
  
  // Particles & Postpositions
  'ni': 'नि', 'ne': 'ने', 'le': 'ले', 'ko': 'को', 'ka': 'का',
  'ki': 'कि', 'lai': 'लाई', 'sanga': 'संग', 'bata': 'बाट',
  'ma': 'मा', 'ba': 'बा',
  
  // Adjectives
  'ramro': 'राम्रो', 'naramro': 'नराम्रो', 'ramailo': 'रमाइलो',
  'thik': 'ठिक', 'dherai': 'धेरै', 'ali': 'अलि', 'ekdam': 'एकदम',
  'sabai': 'सबै', 'kunai': 'कुनै', 'sundar': 'सुन्दर', 'thulo': 'ठूलो',
  'sano': 'सानो', 'naya': 'नयाँ', 'purano': 'पुरानो',
  
  // Family
  'ama': 'आमा', 'buwa': 'बुवा', 'didi': 'दिदी', 'dai': 'दाई',
  'bahini': 'बहिनी', 'bhai': 'भाई',
  
  // Food & Drink
  'khana': 'खाना', 'pani': 'पानी', 'bhat': 'भात', 'dal': 'दाल',
  'tarkari': 'तर्कारी', 'dudh': 'दूध', 'dahi': 'दही', 'panir': 'पनीर',
  'anda': 'अन्डा', 'masu': 'मासु', 'kukhura': 'कुखुरा',
  
  // Numbers
  'ek': 'एक', 'dui': 'दुई', 'tin': 'तीन', 'char': 'चार',
  'pach': 'पाँच', 'chha': 'छ', 'sat': 'सात', 'aath': 'आठ',
  'nau': 'नौ', 'das': 'दस',
  
  // Days
  'sunday': 'आइतबार', 'monday': 'सोमबार', 'tuesday': 'मंगलबार',
  'wednesday': 'बुधबार', 'thursday': 'बिहीबार', 'friday': 'शुक्रबार',
  'saturday': 'शनिबार',
  
  // Time
  'aaja': 'आज', 'bholi': 'भोलि', 'paru': 'पर्सि', 'hijo': 'हिजो',
  'samaya': 'समय', 'din': 'दिन', 'hafta': 'हप्ता', 'mahina': 'महिना',
  'barsha': 'वर्ष',
  
  // Questions
  'kina': 'किन', 'k': 'के', 'kasari': 'कसरी', 'kahile': 'कहिले',
  'kaha': 'कहाँ', 'what': 'के', 'where': 'कहाँ', 'when': 'कहिले',
  'why': 'किन', 'who': 'को', 'how': 'कसरी', 'which': 'कुन',
  
  // Emotions
  'happy': 'खुसी', 'sad': 'दुःखी', 'angry': 'रिसाएको',
  'scared': 'डराएको', 'tired': 'थाकेको', 'hungry': 'भोकलागेको',
  'thirsty': 'तिर्खाएको', 'sick': 'बिरामी', 'fine': 'ठिक',
  'okay': 'ठिक', 'alright': 'ठिक',
  
  // Common English responses
  'yes': 'हो', 'no': 'होइन', 'good': 'राम्रो', 'bad': 'नराम्रो',
  
  // Greetings by time
  'good morning': 'शुभ बिहान', 'good afternoon': 'शुभ दिउँसो',
  'good evening': 'शुभ साँझ', 'good night': 'शुभ रात्री',
  
  // Additional common words
  'manche': 'मान्छे', 'des': 'देश', 'sathi': 'साथी', 'ghar': 'घर',
  'school': 'स्कूल', 'kam': 'काम', 'bato': 'बाटो', 'gaadi': 'गाडी',
  'cycle': 'साइकल', 'swasthya': 'स्वास्थ्य', 'shiksha': 'शिक्षा',
  'shanti': 'शान्ति', 'maya': 'माया', 'prem': 'प्रेम',
  'yaha': 'यहाँ', 'tyaha': 'त्यहाँ', 'sadhai': 'सधैं'
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounce function to limit API call frequency
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Check if element is a text input field
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function isTextInput(element) {
  if (!element) {return false;}
  const tagName = element.localName;

  return tagName === 'input' || tagName === 'textarea';
}

/**
 * Find text node within an element
 * @param {Node} node - Starting node
 * @returns {Node|null} Text node or null
 */
function findTextNode(node) {
  if (!node) {return null;}
  if (node.nodeType === Node.TEXT_NODE) {return node;}

  return findTextNode(node.childNodes?.[0]);
}

/**
 * Move caret to end of editable element
 * @param {Node} elem - Element to set caret in
 */
function moveCaretToEnd(elem) {
  if (!elem) {return;}
  const selection = window.getSelection();
  const range = new Range();

  range.setStart(elem, elem.length || 0);
  range.collapse();
  selection.removeAllRanges();
  selection.addRange(range);
}

// ============================================================================
// Translation Logic
// ============================================================================

/**
 * Translate a word using cache or API
 * @param {string} wordToTranslate - Word to translate
 * @returns {Promise<string>} Translated word
 */
async function translateWord(wordToTranslate) {
  const lowerWord = wordToTranslate.toLowerCase();
  
  // Check cache first (instant translation)
  if (NEPALI_WORD_CACHE[lowerWord]) {
    state.stats.cacheHits++;

    return NEPALI_WORD_CACHE[lowerWord];
  }
  
  // API call with error handling
  try {
    const fetchUrl = `https://www.google.com/inputtools/request?text=${encodeURIComponent(wordToTranslate)}&ime=transliteration_en_ne&num=1`;
    const response = await fetch(fetchUrl, { 
      timeout: 5000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate response structure
    const translatedWord = data?.[1]?.[0]?.[1]?.[0];

    if (!translatedWord) {
      return wordToTranslate;
    }
    
    // Convert English period to Nepali full stop
    return translatedWord.endsWith('.') 
      ? translatedWord.replace('.', '।') 
      : translatedWord;
      
  } catch (error) {
    console.warn('[Type-Nepali] Translation failed:', error.message);

    return wordToTranslate;
  }
}

/**
 * Process and translate the last word in a text field
 * @param {HTMLInputElement|HTMLTextAreaElement} target - Input element
 * @returns {Promise<void>}
 */
async function processTextInput(target) {
  const { value } = target;
  const lines = value.split('\n');
  const lastLine = lines[lines.length - 1];
  const words = lastLine.trim().split(' ');
  const recentWord = words[words.length - 1];
  
  // Skip if word is empty or punctuation
  if (!recentWord || recentWord === ',' || recentWord === '|') {
    return;
  }
  
  state.stats.wordsTranslated++;
  const translatedWord = await translateWord(recentWord);
  
  words[words.length - 1] = translatedWord;
  lines[lines.length - 1] = words.join(' ');
  
  target.value = `${lines.join('\n')  } `;
  target.selectionStart = target.selectionEnd = target.value.length;
}

/**
 * Process text for contenteditable elements
 * @param {Node} textfield - Text node
 * @returns {Promise<void>}
 */
async function processContentEditable(textfield) {
  if (!textfield || !state.isSpacePressed) {return;}
  if (textfield.nodeType !== Node.TEXT_NODE) {return;}
  
  const textFieldValue = textfield.textContent;
  const lines = textFieldValue.split('\n');
  const lastLine = lines[lines.length - 1];
  const words = lastLine.trim().split(' ');
  const recentWord = words[words.length - 1];
  
  if (!recentWord || recentWord === ',' || recentWord === '|') {
    return;
  }
  
  state.stats.wordsTranslated++;
  const translatedWord = await translateWord(recentWord);
  
  words[words.length - 1] = translatedWord;
  lines[lines.length - 1] = words.join(' ');
  
  textfield.data = `${lines.join('\n')  } `;
  state.isSpacePressed = false;
  moveCaretToEnd(textfield);
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handle keydown events for text inputs
 * @param {KeyboardEvent} e - Keyboard event
 */
async function handleKeydown(e) {
  if (e.key === 'Enter') {return;}
  if (e.key !== ' ') {return;}
  
  if (!isTextInput(e.target)) {
    handleContentEditable(e);

    return;
  }
  
  await processTextInput(e.target);
  e.preventDefault();
}

/**
 * Handle contenteditable elements using MutationObserver
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleContentEditable(e) {
  const targetDiv = e.target;
  
  state.observer.observe(targetDiv, {
    childList: true,
    subtree: true,
    characterDataOldValue: true
  });
  
  clearTimeout(state.translationTimeout);
  state.translationTimeout = setTimeout(() => {
    state.isSpacePressed = true;
    state.promiseResolver?.(true);
  }, 500);
  
  moveCaretToEnd(state.currentTextfield);
}

/**
 * MutationObserver callback for contenteditable elements
 * @param {MutationRecord[]} mutations - Mutation records
 */
async function handleMutations(mutations) {
  const waitForSpacePress = () => new Promise(resolve => {
    state.promiseResolver = resolve;
  });
  
  for (const mutation of mutations) {
    state.currentTextfield = findTextNode(mutation.target);
    await waitForSpacePress();
    await processContentEditable(mutation.target);
  }
}

// ============================================================================
// Extension Messaging
// ============================================================================

/**
 * Enable transliteration
 */
function enableTransliteration() {
  if (state.isEnabled) {return;}
  
  state.isEnabled = true;
  window.addEventListener('keydown', handleKeydown);
  state.observer = new MutationObserver(handleMutations);
  state.promiseResolver = null;
  state.currentTextfield = null;
}

/**
 * Disable transliteration
 */
function disableTransliteration() {
  if (!state.isEnabled) {return;}
  
  state.isEnabled = false;
  window.removeEventListener('keydown', handleKeydown);
  state.observer?.disconnect();
  clearTimeout(state.translationTimeout);
}

// ============================================================================
// Initialization
// ============================================================================

// Listen for messages from background/popup
browserAPI.runtime.onMessage.addListener((request) => {
  if (request.translate) {
    enableTransliteration();
  } else {
    disableTransliteration();
  }
  
  // Sync state to storage
  browserAPI.storage.sync.set({ translateText: request.translate })
    .catch(err => console.warn('[Type-Nepali] Storage sync failed:', err));
  
  return true;
});

// Load initial state
browserAPI.storage.sync.get(['translateText', 'stats'])
  .then((obj) => {
    if (obj.translateText) {
      enableTransliteration();
    }
    if (obj.stats) {
      state.stats = { ...state.stats, ...obj.stats };
    }
  })
  .catch(err => console.warn('[Type-Nepali] Failed to load state:', err));

// Save stats periodically
setInterval(() => {
  browserAPI.storage.sync.set({ stats: state.stats })
    .catch(err => console.warn('[Type-Nepali] Failed to save stats:', err));
}, 30000); // Every 30 seconds

// Save stats on page unload
window.addEventListener('beforeunload', () => {
  browserAPI.storage.sync.set({ stats: state.stats })
    .catch(err => console.warn('[Type-Nepali] Failed to save stats:', err));
});
