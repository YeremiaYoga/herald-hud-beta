import * as herald_hud from "./heraldHud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    await herald_hud.heraldHud_renderHtml();
    await herald_hud.heraldHud_renderHeraldHud();
    console.log("Foundry VTT Version:", game.version);
console.log("D&D System Version:", game.system.version);

  }, 1000);
});
