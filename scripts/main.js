import * as herald_hud from "./heraldHud.js";
import * as hud_13 from "./v13/heraldHud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    const isV13OrAbove = isNewerVersion(game.version, "12.999");
    console.log("Versi Foundry VTT:", game.version);
    if (isV13OrAbove) {
      await hud_13.heraldHud_renderHtml();
      await hud_13.heraldHud_renderHeraldHud();
    } else {
      await herald_hud.heraldHud_renderHtml();
      await herald_hud.heraldHud_renderHeraldHud();
    }
  }, 1000);
  JournalEntry.sheet = core.JournalTextTinyMCESheet;

  for (let entry of game.journal.entries) {
    if (!(entry.sheet instanceof core.JournalTextTinyMCESheet)) {
      entry.sheet = new core.JournalTextTinyMCESheet(entry);
      entry.render(true);
    }
  }
});

Hooks.once("init", () => {
  const isV13OrAbove = isNewerVersion(game.version, "12.999");

  const cssFiles = isV13OrAbove
    ? [
        "modules/herald-hud-beta/styles/v13/style.css",
        "modules/herald-hud-beta/styles/v13/journaling.css",
        "modules/herald-hud-beta/styles/playlist.css",
      ]
    : [
        "modules/herald-hud-beta/styles/style.css",
        "modules/herald-hud-beta/styles/menuDetail.css",
        "modules/herald-hud-beta/styles/playlist.css",
      ];

  for (const cssFile of cssFiles) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssFile;
    document.head.appendChild(link);
    console.log("Loaded CSS:", cssFile);
  }
  game.settings.register("herald-hud", "spellsTrackerOff", {
    name: "Disable Spells Tracker",
    hint: "Turn off the spells tracker in the HUD.",
    scope: "client",
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
  game.settings.register("herald-hud", "speedHudbarOff", {
    name: "Show Speed Hud Bar",
    hint: "Display Speed Hud Bar",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register("herald-hud", "hudbarImageFrame", {
    name: "Hud Bar Image Frame",
    hint: "Hud Bar Image Frame",
    scope: "client",
    config: true,
    type: String,
    default: "basic_frame",
  });
  game.settings.register("herald-hud", "heraldHudScale", {
    name: "Herald Hud Size",
    hint: "Herald Hud Size",
    scope: "client",
    config: true,
    type: String,
    default: "100",
  });
  game.settings.register("herald-hud", "dialogBorderColor", {
    name: "Dialog Border Color",
    hint: "Dialog Border Color",
    scope: "client",
    config: true,
    type: String,
    default: "#FFD700",
  });
  game.settings.register("herald-hud", "dialogBoxShadowColor", {
    name: "Dialog BoxShadow Color",
    hint: "Dialog BoxShadow Color",
    scope: "client",
    config: true,
    type: String,
    default: "#CCAC00",
  });

  game.settings.register("herald-hud", "settingButtonColor", {
    name: "Setting Button Color",
    hint: "Setting Button Color",
    scope: "client",
    config: true,
    type: String,
    default: "#ffffff",
  });
  game.settings.register("herald-hud", "informationButtonColor", {
    name: "Information Button Color",
    hint: "Information Button Color",
    scope: "client",
    config: true,
    type: String,
    default: "#ffffff",
  });

  game.settings.register("herald-hud", "enableCombineFeature", {
    name: "Enable Combine Features",
    hint: "Enable Combine Features",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register("herald-hud", "hudBgDialog", {
    name: "Hud Background Dialog",
    hint: "Hud Background Dialog",
    scope: "client",
    config: true,
    type: String,
    default: "pattern",
  });

  game.settings.register("herald-hud", "speedIconColor", {
    name: "Speed Icon Color",
    hint: "Speed Icon Color",
    scope: "client",
    config: true,
    type: String,
    default: "#1ad1ff",
  });

  game.settings.register("herald-hud", "overwriteWeaponMastery", {
    name: "Overwrite Weapon Mastery",
    hint: "Overwrite Weapon Mastery",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
});
