let btn = document.querySelector("button");
let translateState;

const storage = (typeof browser !== "undefined" ? browser : chrome).storage;
const tabs = (typeof browser !== "undefined" ? browser : chrome).tabs;
const runtime = (typeof browser !== "undefined" ? browser : chrome).runtime;

(async () => {
  try {
    const obj = await storage.sync.get(["translateText"]);
    translateState = obj.translateText || false;
    changeButtonText(translateState);
  } catch (error) {
    console.error("Error fetching translation state:", error);
  }
})();

btn.addEventListener("click", function () {
  let newState = btn.textContent === "On" ? false : true;
  toggleTranslateValue(newState);
  changeButtonText(newState);
  console.log("Button clicked, new state:", newState);
});

async function toggleTranslateValue(boolean) {
  try {
    const tabsQuery = await tabs.query({});
    for (let tab of tabsQuery) {
      const pattern = /^(chrome|about)\:\/\/.*/;
      if (pattern.test(tab.url)) continue;

      try {
        await tabs.sendMessage(tab.id, { translate: boolean });
      } catch (error) {
        console.error("Error sending message to tab:", error);
      }
    }
    await storage.sync.set({ translateText: boolean });
  } catch (error) {
    console.error("Error toggling translate value:", error);
  }
}

function changeButtonText(boolean) {
  btn.textContent = boolean ? "On" : "Off";
  btn.classList.toggle("off", !boolean);
}

runtime.onMessage.addListener(function (request) {
  changeButtonText(request.translate);
});
