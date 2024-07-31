browser.commands.onCommand.addListener((command) => {
  if (command === "toggle-feature") {
    browser.tabs.query({}).then((tabs) => {
      for (let tab of tabs) {
        const pattern = /^(chrome|about)\:\/\/.*/;
        if (pattern.test(tab.url)) continue;

        getCurrentTranslationState().then(boolean => {
          browser.tabs.sendMessage(tab.id, { translate: !boolean }).catch(error => {
            console.error("Error sending message to tab:", error);
          });
        });
      }
    });
  }
});

async function getCurrentTranslationState() {
  let object = await browser.storage.sync.get(["translateText"]);
  return object.translateText || false;
}
