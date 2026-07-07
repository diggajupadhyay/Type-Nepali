/**
 * Type Nepali Content Script - Minimal Version
 * Real-time English to Nepali transliteration
 */

'use strict';

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined' && browser.runtime) ? browser : chrome;

// Minimal state
const state = {
  isEnabled: false,
  isSpacePressed: false,
  translationTimeout: null,
  promiseResolver: null,
  currentTextfield: null,
  observer: null
};

// Minimal essential word cache (most common words)
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
  'why': 'किन', 'who': 'को', 'how': 'क', 'who': 'को', 'how': 'कसरी', 'which': 'कुन',
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

// Utility functions
function isTextInput(element) {
  if (!element) return false;
  const tagName = element.localName;
  return tagName === 'input' || tagName === 'textarea';
}

function findTextNode(node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node;
  return findTextNode(node.childNodes?.[0]);
}

function moveCaretToEnd(elem) {
  if (!elem) return;
  const selection = window.getSelection();
  const range = new Range();
  range.setStart(elem, elem.length || 0);
  range.collapse();
  selection.removeAllRanges();
  selection.addRange(range);
}

// Translation
async function translateWord(wordToTranslate) {
  const lowerWord = wordToTranslate.toLowerCase();
  
  // Check cache first
  if (NEPALI_WORD_CACHE[lowerWord]) {
    return NEPALI_WORD_CACHE[lowerWord];
  }
  
  // API call
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
    const translatedWord = data?.[1]?.[0]?.[1]?.[0];
    
    if (!translatedWord) {
      return wordToTranslate;
    }
    
    // Convert English period to Nepali full stop
    return translatedWord.endsWith('.') 
      ? translatedWord.replace('.', '।') 
      : translatedWord;
      
  } catch (error) {
    return wordToTranslate;
  }
}

// Process text input
async function processTextInput(target) {
  const { value } = target;
  const lines = value.split('\n');
  const lastLine = lines[lines.length - 1];
  const words = lastLine.trim().split(' ');
  const recentWord = words[words.length - 1];
  
  if (!recentWord || recentWord === ',' || recentWord === '|') {
    return;
  }
  
  const translatedWord = await translateWord(recentWord);
  
  words[words.length - 1] = translatedWord;
  lines[lines.length - 1] = words.join(' ');
  
  target.value = `${lines.join('\n')  } `;
  target.selectionStart = target.selectionEnd = target.value.length;
}

// Process contenteditable
async function processContentEditable(textfield) {
  if (!textfield || !state.isSpacePressed) return;
  if (textfield.nodeType !== Node.TEXT_NODE) return;
  
  const textFieldValue = textfield.textContent;
  const lines = textFieldValue.split('\n');
  const lastLine = lines[lines.length - 1];
  const words = lastLine.trim().split(' ');
  const recentWord = words[words.length - 1];
  
  if (!recentWord || recentWord === ',' || recentWord === '|') {
    return;
  }
  
  const translatedWord = await translateWord(recentWord);
  
  words[words.length - 1] = translatedWord;
  lines[lines.length - 1] = words.join(' ');
  
  textfield.data = `${lines.join('\n')  } `;
  state.isSpacePressed = false;
  moveCaretToEnd(textfield);
}

// Event handlers
async function handleKeydown(e) {
  if (e.key === 'Enter') return;
  if (e.key !== ' ') return;
  
  if (!isTextInput(e.target)) {
    handleContentEditable(e);
    return;
  }
  
  await processTextInput(e.target);
  e.preventDefault();
}

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

// Extension messaging
function enableTransliteration() {
  if (state.isEnabled) return;
  
  state.isEnabled = true;
  window.addEventListener('keydown', handleKeydown);
  state.observer = new MutationObserver(handleMutations);
  state.promiseResolver = null;
  state.currentTextfield = null;
}

function disableTransliteration() {
  if (!state.isEnabled) return;
  
  state.isEnabled = false;
  window.removeEventListener('keydown', handleKeydown);
  state.observer?.disconnect();
  clearTimeout(state.translationTimeout);
}

// Listen for messages from background/popup
browserAPI.runtime.onMessage.addListener((request) => {
  if (request.translate) {
    enableTransliteration();
  } else {
    disableTransliteration();
  }
  return true;
});

// Load initial state
browserAPI.storage.sync.get(['translateText'])
  .then((obj) => {
    if (obj.translateText) {
      enableTransliteration();
    }
  })
  .catch(err => console.warn('[Type-Nepali] Failed to load state:', err));