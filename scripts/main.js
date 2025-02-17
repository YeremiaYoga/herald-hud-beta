import * as herald_hud from "./heraldHud.js";

Hooks.on("ready", () => {
  setTimeout(() => {
    herald_hud.heraldHud_renderHtml();
    herald_hud.heraldHud_renderHeraldHud();
  }, 1000);
});
