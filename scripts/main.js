import * as herald_hud from "./heraldHud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    await herald_hud.heraldHud_renderHtml();
    await herald_hud.heraldHud_renderHeraldHud();
  }, 1000);
});

Hooks.on("init", () => {

});
