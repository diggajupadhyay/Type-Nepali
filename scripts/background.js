browser.commands.onCommand.addListener((command) => {
  // Only handle the specific command you want (replace with your command name)
  if (command === "toggle-feature") {
    browser.tabs.query({}).then((tabs) => {
      tabs.forEach(async (tab) => {
        // If you don't need internal URL filtering, remove this:
        const pattern = /^(chrome|about)\:\/\/.*/;
        if (pattern.test(tab.url)) return;

        let boolean = await getCurrentTranslationState();

        await browser.tabs.sendMessage(tab.id, {
          translate: !boolean,
        });
      });
    });
  }
});

async function getCurrentTranslationState() {
  let object = await browser.storage.sync.get(["translateText"]);
  return object.translateText;
}
