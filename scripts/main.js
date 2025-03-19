import * as herald_hud from "./heraldHud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    await herald_hud.heraldHud_renderHtml();
    await herald_hud.heraldHud_renderHeraldHud();
  }, 1000);
});

Hooks.once("init", () => {
  game.settings.register("herald-hud", "spellsTrackerOff", {
    name: "Disable Spells Tracker",
    hint: "Turn off the spells tracker in the HUD.",
    scope: "client", // Hanya berlaku untuk setiap user
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("herald-hud", "dockHudToBottom", {
    name: "Dock HUD to Bottom",
    hint: "Move the HUD to the bottom of the screen.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("herald-hud", "statsAbbreviations", {
    name: "Use Stats Abbreviations",
    hint: "Display stats using abbreviations (e.g., STR, DEX).",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("herald-hud", "displayChargeTracker", {
    name: "Show Charge Tracker",
    hint: "Display charge tracker for items.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register("herald-hud", "displayInformationButton", {
    name: "Show Information Button",
    hint: "Display Information Button",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
});
