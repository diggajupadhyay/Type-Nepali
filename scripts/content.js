/**
 * Type Nepali Content Script
 * Real-time English to Nepali transliteration for input fields and contenteditable areas.
 * @version 1.5.1
 */

'use strict';

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

/** @type {Object} Internal extension state */
const state = {
  isEnabled: false
};

/**
 * Hardcoded cache of the most common English→Nepali word mappings.
 * Prevents network calls for frequent words.
 */
const NEPALI_WORD_CACHE = {
  'namaste': 'नमस्ते', 'hello': 'नमस्ते', 'hi': 'नमस्ते', 'bye': 'अलविदा',
  'dhanyabad': 'धन्यवाद', 'thanks': 'धन्यवाद', 'please': 'कृपया',
  'sorry': 'माफ गर्नुहोस्', 'welcome': 'स्वागत छ',
  'ram': 'राम', 'sita': 'सीता', 'krishna': 'कृष्ण', 'shiva': 'शिव',
  'kathmandu': 'काठमाडौं', 'pokhara': 'पोखरा', 'everest': 'सगरमाथा',
  'ma': 'म', 'timi': 'तिमी', 'tapai': 'तपाईं', 'mero': 'मेरो',
  'tero': 'तेरो', 'hamro': 'हाम्रो', 'yo': 'यो', 'tyo': 'त्यो',
  'ho': 'हो', 'hoina': 'होइन', 'huncha': 'हुन्छ', 'chaina': 'छैन',
  'cha': 'छ', 'gare': 'गरे', 'bhayo': 'भयो', 'ra': 'र',
  'ramro': 'राम्रो', 'naramro': 'नराम्रो', 'thik': 'ठिक',
  'ama': 'आमा', 'buwa': 'बुवा', 'didi': 'दिदी', 'dai': 'दाई',
  'bahini': 'बहिनी', 'bhai': 'भाई',
  'khana': 'खाना', 'pani': 'पानी', 'bhat': 'भात', 'dal': 'दाल',
  'tarkari': 'तर्कारी', 'dudh': 'दूध', 'dahi': 'दही',
  'anda': 'अन्डा', 'masu': 'मासु', 'kukhura': 'कुखुरा',
  'ek': 'एक', 'dui': 'दुई', 'tin': 'तीन', 'char': 'चार',
  'pach': 'पाँच', 'chha': 'छ', 'sat': 'सात', 'aath': 'आठ',
  'nau': 'नौ', 'das': 'दस',
  'sunday': 'आइतबार', 'monday': 'सोमबार', 'tuesday': 'मंगलबार',
  'wednesday': 'बुधबार', 'thursday': 'बिहीबार', 'friday': 'शुक्रबार',
  'saturday': 'शनिबार',
  'aaja': 'आज', 'bholi': 'भोलि', 'paru': 'पर्सि', 'hijo': 'हिजो',
  'samaya': 'समय', 'din': 'दिन', 'hafta': 'हप्ता', 'mahina': 'महिना',
  'barsha': 'वर्ष',
  'kina': 'किन', 'k': 'के', 'kasari': 'कसरी', 'kahile': 'कहिले',
  'kaha': 'कहाँ', 'what': 'के', 'where': 'कहाँ', 'when': 'कहिले',
  'why': 'किन', 'who': 'को', 'how': 'कसरी', 'which': 'कुन',
  'happy': 'खुसी', 'sad': 'दुःखी', 'angry': 'रिसाएको',
  'scared': 'डराएको', 'tired': 'थाकेको', 'hungry': 'भोकलागेको',
  'thirsty': 'तिर्खाएको', 'sick': 'बिरामी', 'fine': 'ठिक',
  'okay': 'ठिक', 'alright': 'ठिक',
  'yes': 'हो', 'no': 'होइन', 'good': 'राम्रो', 'bad': 'नराम्रो',
  'good morning': 'शुभ बिहान', 'good afternoon': 'शुभ दिउँसो',
  'good evening': 'शुभ साँझ', 'good night': 'शुभ रात्री',
  'manche': 'मान्छे', 'des': 'देश', 'sathi': 'साथी', 'ghar': 'घर',
  'school': 'स्कूल', 'kam': 'काम', 'bato': 'बाटो', 'gaadi': 'गाडी',
  'cycle': 'साइकल', 'swasthya': 'स्वास्थ्य', 'shiksha': 'शिक्षा',
  'shanti': 'शान्ति', 'maya': 'माया', 'prem': 'प्रेम',
  'yaha': 'यहाँ', 'tyaha': 'त्यहाँ', 'sadhai': 'सधैं'
};

/* ── Helpers ─────────────────────────────────────────────────── */

/**
 * Check if an element is a standard text input (excluding password).
 * @param {Element|null} element
 * @returns {boolean}
 */
function isTextInput(element) {
  if (!element) {return false;}
  const tagName = element.localName;

  if (tagName === 'input') {
    return element.type !== 'password';
  }

  return tagName === 'textarea';
}

/**
 * Split word into leading punctuation, core letters, and trailing punctuation.
 * @param {string} word
 * @returns {{prefix: string, core: string, suffix: string}}
 */
function splitWord(word) {
  const match = word.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);

  if (match) {
    return {
      prefix: match[1],
      core: match[2],
      suffix: match[3]
    };
  }

  return { prefix: '', core: word, suffix: '' };
}

/**
 * Get the last typed word before a given index in a string.
 * @param {string} text
 * @param {number} index
 * @returns {{word: string, start: number}}|null
 */
function getLastWordBeforeIndex(text, index) {
  const before = text.slice(0, index);
  // Trim trailing whitespace to find word boundary
  const trimmed = before.trimEnd();

  if (trimmed.length === 0) {return null;}
  const lastSpace = trimmed.lastIndexOf(' ');
  const start = lastSpace === -1 ? 0 : lastSpace + 1;
  const word = trimmed.slice(start);

  // If the word consists only of punctuation, ignore
  if (/^[\W_]+$/.test(word)) {return null;}

  return { word, start: start + (before.length - trimmed.length) };
}

/* ── Translation ──────────────────────────────────────────────── */

/**
 * Translate an English word to Nepali via cache or Google Input Tools API.
 * If the word ends with '.', it is replaced with Nepali full stop '।'.
 * @param {string} wordToTranslate
 * @returns {Promise<string>}
 */
async function translateWord(wordToTranslate) {
  const { prefix, core, suffix } = splitWord(wordToTranslate);
  const lowerCore = core.toLowerCase();

  // 1) Cache hit
  if (NEPALI_WORD_CACHE[lowerCore]) {
    return prefix + NEPALI_WORD_CACHE[lowerCore] + suffix;
  }

  if (!core) {return wordToTranslate;}

  // 2) API call with real timeout via AbortController
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const fetchUrl = `https://www.google.com/inputtools/request?text=${encodeURIComponent(lowerCore)}&ime=transliteration_en_ne&num=1`;
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    let translatedWord = data?.[1]?.[0]?.[1]?.[0];

    if (!translatedWord) {
      return wordToTranslate;
    }

    // Convert English period to Nepali full stop
    if (translatedWord.endsWith('.')) {
      translatedWord = translatedWord.replace(/\.$/, '।');
    }

    return prefix + translatedWord + suffix;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Timeout - silently fallback
    }

    return wordToTranslate;
  }
}

/* ── Input Fields (input / textarea) ──────────────────────────── */

/**
 * Handle space key on standard input/textarea elements.
 * Replaces the last word before the cursor with its Nepali translation.
 * @param {HTMLInputElement|HTMLTextAreaElement} target
 */
async function processTextInput(target) {
  const { value, selectionStart } = target;

  if (selectionStart === 0) {return;}

  const result = getLastWordBeforeIndex(value, selectionStart);

  if (!result) {return;}

  const translatedWord = await translateWord(result.word);
  const start = result.start;
  const end = start + result.word.length;
  const newValue = `${value.slice(0, start) + translatedWord + value.slice(end)  } `;

  target.value = newValue;
  target.selectionStart = target.selectionEnd = newValue.length;
}

/* ── Contenteditable Elements ─────────────────────────────────── */

/**
 * Handle space key on contenteditable elements.
 * Replaces the last word before the cursor with its Nepali translation.
 * @param {Event} e
 */
function handleContentEditable(e) {
  e.preventDefault();

  const sel = window.getSelection();

  if (!sel.rangeCount || !sel.anchorNode) {return;}

  const textNode = sel.anchorNode;

  if (textNode.nodeType !== Node.TEXT_NODE) {return;}

  const offset = sel.anchorOffset;
  const text = textNode.textContent;

  if (offset === 0) {return;}

  const result = getLastWordBeforeIndex(text, offset);

  if (!result) {return;}

  const translatedWord = translateWord(result.word);
  const start = result.start;
  const end = start + result.word.length;

  // Replace the word in the text node
  textNode.textContent = `${text.slice(0, start) + translatedWord + text.slice(end)  } `;

  // Place cursor after the inserted space
  const newOffset = start + translatedWord.length + 1;
  const range = document.createRange();

  range.setStart(textNode, newOffset);
  range.setEnd(textNode, newOffset);
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ── Event Handlers ───────────────────────────────────────────── */

/**
 * Global keydown handler — triggers on space bar press.
 * @param {KeyboardEvent} e
 */
async function handleKeydown(e) {
  if (e.key !== ' ' || e.key === 'Enter') {return;}

  if (isTextInput(e.target)) {
    await processTextInput(e.target);
  } else if (e.target.isContentEditable) {
    handleContentEditable(e);
  }
}

/* ── Enable / Disable ─────────────────────────────────────────── */

function enableTransliteration() {
  if (state.isEnabled) {return;}
  state.isEnabled = true;
  window.addEventListener('keydown', handleKeydown, true);
}

function disableTransliteration() {
  if (!state.isEnabled) {return;}
  state.isEnabled = false;
  window.removeEventListener('keydown', handleKeydown, true);
}

/* ── Extension Messaging ──────────────────────────────────────── */

browserAPI.runtime.onMessage.addListener((request) => {
  if (request.translate) {
    enableTransliteration();
  } else {
    disableTransliteration();
  }

  return true;
});

// Load initial state from storage
browserAPI.storage.sync.get(['translateText'])
  .then(obj => {
    if (obj.translateText) {enableTransliteration();}
  })
  .catch(_err => {
    // Silently ignore storage errors
  });
