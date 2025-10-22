let isSpacePressed = false;
let observer;
let promiseResolver = null;
let currentTextfield = null;

async function TRANSLATION_HANDLER(e) {
  if (e.key === "Enter") return;
  if (e.key !== " ") return;

  if (!(e.target.localName === "input" || e.target.localName === "textarea")) {
    HANDLE_TRANSLATION_FOR_OTHER_FIELDS(e);
    return;
  }

  let { value } = e.target;
  let lines = value.split("\n");
  let lastLine = lines[lines.length - 1];

  let words = lastLine.trim().split(" ");
  let recentWord = words[words.length - 1];
  if (!recentWord || recentWord === "," || recentWord === "|") {
    return;
  }

  let translatedWord = await TRANSLATION_API_CALL(recentWord);

  words[words.length - 1] = translatedWord;
  lastLine = words.join(" ");

  lines[lines.length - 1] = lastLine;
  e.target.value = lines.join("\n") + " ";
  e.target.selectionStart = e.target.selectionEnd = e.target.value.length;
  e.preventDefault();
}

async function callback(mutationRecord) {
  function WAIT_FOR_IS_SPACE_PRESSED() {
    return new Promise((resolve) => {
      promiseResolver = resolve;
    });
  }

  for (let mutations of mutationRecord) {
    currentTextfield = FIND_TEXT_NODE(mutations.target);
    await WAIT_FOR_IS_SPACE_PRESSED();
    await TRANSLATE_FOR_OTHER(mutations.target);
  }
}

async function HANDLE_TRANSLATION_FOR_OTHER_FIELDS(e) {
  let targetDiv = e.target;

  observer.observe(targetDiv, {
    childList: true,
    subtree: true,
    characterDataOldValue: true,
  });

  clearTimeout(translationTimeout);
  translationTimeout = setTimeout(async () => {
    isSpacePressed = true;
    promiseResolver && promiseResolver(true);
  }, 500);

  MOVE_CARET_TO_END(currentTextfield);
}

async function TRANSLATE_FOR_OTHER(textfield) {
  if (!textfield) return;
  if (!isSpacePressed) return;

  if (!(textfield.nodeType === Node.TEXT_NODE)) return;
  let textFieldValue = textfield.textContent;
  let lines = textFieldValue.split("\n");
  let lastLine = lines[lines.length - 1];

  let words = lastLine.trim().split(" ");
  let recentWord = words[words.length - 1];
  if (!recentWord || recentWord === "," || recentWord === "|") {
    return;
  }

  let translatedWord = await TRANSLATION_API_CALL(recentWord);

  words[words.length - 1] = translatedWord;
  lastLine = words.join(" ");

  lines[lines.length - 1] = lastLine;
  textfield.data = lines.join("\n") + " ";
  isSpacePressed = false;
  MOVE_CARET_TO_END(textfield);
}

async function TRANSLATION_API_CALL(wordToTranslate) {
  let fetchUrl = `https://www.google.com/inputtools/request?text=${wordToTranslate}&ime=transliteration_en_ne&num=1`;

  let response = await fetch(fetchUrl);
  response = await response.json();
  let translatedWord = response[1][0][1][0];
  translatedWord = translatedWord.endsWith(".")
    ? translatedWord.replace(".", "।")
    : translatedWord;

  return translatedWord;
}

function FIND_TEXT_NODE(node) {
  if (!node) return;
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  } else {
    return FIND_TEXT_NODE(node.childNodes[0]);
  }
}

function MOVE_CARET_TO_END(elem) {
  if (!elem) return;
  let selection = window.getSelection();
  let range = new Range();
  range.setStart(elem, elem.length);
  range.collapse();

  selection.removeAllRanges();

  selection.addRange(range);
}

chrome.runtime.onMessage.addListener(function (request) {
  if (request.translate) {
    window.addEventListener("keydown", TRANSLATION_HANDLER);
    observer = new MutationObserver(callback);
    promiseResolver = currentTextfield = null;
  } else {
    window.removeEventListener("keydown", TRANSLATION_HANDLER);
    observer.disconnect();
  }
  chrome.storage.sync.set({ translateText: request.translate });
});

chrome.storage.sync.get(["translateText"]).then((obj) => {
  if (obj.translateText) {
    window.addEventListener("keydown", TRANSLATION_HANDLER);
    observer = new MutationObserver(callback);
    promiseResolver = currentTextfield = null;
  }
});
