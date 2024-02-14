let btn = document.querySelector("button");
let translateState;

// Use browser instead of chrome and check for compatibility
const storage = (typeof browser !== "undefined" ? browser : chrome).storage;
const tabs = (typeof browser !== "undefined" ? browser : chrome).tabs;
const runtime = (typeof browser !== "undefined" ? browser : chrome).runtime;

storage.sync.get(["translateText"]).then((obj) => {
  translateState = obj.translateText;
  CHANGE_BUTTON_TEXT(obj.translateText);
});

btn.addEventListener("click", function () {
  let btnTxtContent = btn.textContent;
  if (btnTxtContent === "On") {
    TOGGLE_TRANSLATE_VALUE(false);
    CHANGE_BUTTON_TEXT(false);
  } else {
    TOGGLE_TRANSLATE_VALUE(true);
    CHANGE_BUTTON_TEXT(true);
  }
});

async function TOGGLE_TRANSLATE_VALUE(boolean) {
  try {
    const tabsQuery = await tabs.query({});
    tabsQuery.forEach(async (tab) => {
      console.log(tab);
      // if the tab is a chrome or about url return
      const pattern = /^(chrome|about)\:\/\/.*/;
      if (pattern.test(tab.url)) return;

      await tabs.sendMessage(tab.id, {
        translate: boolean,
      });
    });
  } catch (error) {
    console.error("Error toggling translate value:", error);
  }
}

function CHANGE_BUTTON_TEXT(boolean) {
  if (boolean) {
    btn.textContent = "On";
    btn.classList.remove("off");
  } else {
    btn.textContent = "Off";
    btn.classList.add("off");
  }
}

runtime.onMessage.addListener(function (request) {
  CHANGE_BUTTON_TEXT(request.translate);
});
