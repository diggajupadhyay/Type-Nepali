browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-feature") {
    const currentState = await getCurrentTranslationState();
    const newState = !currentState;
    
    await browser.storage.sync.set({ translateText: newState });
    
    browser.tabs.query({}).then((tabs) => {
      for (let tab of tabs) {
        const pattern = /^(chrome|about|moz-extension)\:\/\/.*/;
        if (pattern.test(tab.url)) continue;

        browser.tabs.sendMessage(tab.id, { translate: newState }).catch(error => {
          // Silently fail if tab doesn't have content script loaded
        });
      }
    });
  }
});

async function getCurrentTranslationState() {
  let object = await browser.storage.sync.get(["translateText"]);
  return object.translateText || false;
}
