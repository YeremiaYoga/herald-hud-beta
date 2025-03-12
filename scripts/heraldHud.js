let heraldHud_actorSelected = null;
let heraldHud_checkerValue = null;
let heraldHud_spellsTrackerOff = false;
let heraldHud_dockHudToBottom = false;
let heraldHud_statsAbbreviations = false;
let heraldHud_displayChargeTracker = false;
let heraldHud_gameVersion = ``;
let hp0 = "#8B0000";
let hp25 = "#bc3c04";
let hp50 = "#c47404";
let hp75 = "#8c9c04";
let hp100 = "#389454";
let hpgradient = "rgb(34, 34, 34)";

let heraldHud_listChargeTracker = [
  "Rage",
  "Bardic Inspiration",
  "Channel Divinity",
  "Indomitable",
  "Second Wind",
  "Action Surge",
  "Ki",
  "Ki Point",
  "Lay on Hands",
  "Favored Foe",
  "Arcane Recovery",
  "Sorcery Points",
  "Wild Shape",
  "Superiority Dice",
  "Divine Sense",
  "Arcane Ward",
  "Relentless Endurance",
  "Stone’s Endurance",
  "Fury of the Small",
];

Hooks.on("ready", () => {
  heraldHud_gameVersion = game.system.version;
});

async function heraldHud_renderHtml() {
  try {
    const response = await fetch(
      "/modules/herald-hud-beta/templates/heraldHud-container.html"
    );
    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const heraldHud = div.firstChild;
    heraldHud.id = "heraldHud";

    document.body.appendChild(heraldHud);
  } catch (err) {
    console.error("Failed to load template heraldHud.html:", err);
  }
}

async function heraldHud_renderHeraldHud() {
  await heraldHud_getActorData();
  setTimeout(async () => {
    await heraldHud_renderActorData();
    await heraldHud_updateDataActor();
    await heraldHud_updateMovementsActor();
    await heraldHud_universalChecker();
    await heraldHud_updateItemFavoriteActor();
    await heraldHud_updateItemCosumablesActor();
    await heraldHud_renderHtmlDialog();
    await heraldHud_resetDialog();
    await heraldHud_updateEndTurnButton();
    await heraldHud_renderChargeTracker();
  }, 1000);
}

async function heraldHud_getActorData() {
  const user = game.user;
  let selectedActor = user.character;

  let sceneListActor = game.scenes.viewed.tokens
    .filter((t) => t.actor.type === "character")
    .map((t) => t.actor);

  if (selectedActor) {
    heraldHud_actorSelected = selectedActor;
  } else {
    for (let actor of sceneListActor) {
      if (actor.ownership[user.id] === 3) {
        heraldHud_actorSelected = actor;
        break;
      }
    }
  }

  let heraldHudDiv = document.getElementById("heraldHud");
  if (heraldHudDiv) {
    heraldHudDiv.style.display = heraldHud_actorSelected ? "block" : "none";
  }
}

Hooks.on("updateUser", async (user, data) => {
  if (data.character) {
    setTimeout(async () => {
      await heraldHud_renderHeraldHud();
    }, 500);
  }
});

async function heraldHud_renderActorData() {
  let actor = heraldHud_actorSelected;
  let imageActorDiv = document.getElementById("heraldHud-imageContainer");
  if (imageActorDiv) {
    imageActorDiv.innerHTML = `
    <div class="heraldHud-imageValueDiv">
      <img src="${actor.img}" alt="" class="heraldHud-imageView" />
    </div>
  `;
  }

  imageActorDiv.addEventListener("dblclick", async (event) => {
    const token = await fromUuid(actor.uuid);
    if (token) {
      token.sheet.render(true);
    } else {
      console.warn("Token not found on the current scene.");
    }
  });
  imageActorDiv.addEventListener("click", async (event) => {
    let targetTokens = canvas.tokens.placeables.filter(
      (t) => t.actor?.uuid === actor.uuid
    );

    if (targetTokens.length > 0) {
      let targetToken = targetTokens[0]; // Ambil token pertama

      targetToken.control({ releaseOthers: true });
      canvas.pan({ x: targetToken.x, y: targetToken.y });
    }
  });

  let actionContainerDiv = document.getElementById("heraldHud-actionContainer");
  actionContainerDiv.innerHTML = "";
  const actions = [
    { id: "inventory", text: "Inventory" },
    { id: "loot", text: "Loots" },
    { id: "features", text: "Features" },
    { id: "stats", text: "Stats" },
  ];

  const hasSpells = actor?.items.some((item) => item.type === "spell");

  if (hasSpells) {
    actions.splice(3, 0, { id: "spells", text: "Spells" });
  }

  actions.forEach((action) => {
    let container = document.createElement("div");
    container.id = `heraldHud-${action.id}Container`;
    container.className = `heraldHud-actionMenuContainer`;

    let button = document.createElement("div");
    button.id = `heraldHud-${action.id}Button`;
    button.className = `heraldHud-${action.id}Button`;
    button.textContent = action.text;

    button.addEventListener("click", async () => {
      await heraldHud_showDialog(action.id);
    });

    container.appendChild(button);

    actionContainerDiv.appendChild(container);
  });

  let preparedSpellsActionContainerDiv = document.getElementById(
    "heraldHud-preparedSpellsActionContainer"
  );
  const spellsData = actor.items.filter(
    (item) =>
      item.type === "spell" &&
      item.system.preparation.mode === "prepared" &&
      item.system.level > 0
  );
  if (preparedSpellsActionContainerDiv && spellsData.length > 0) {
    preparedSpellsActionContainerDiv.innerHTML = `
    <div id="heraldHud-preparedSpellsContainer" class="heraldHud-preparedSpellsContainer">
      <div id="heraldHud-preparedSpellsWrapper" class="heraldHud-preparedSpellsWrapper">
        <div id="heraldHud-preparedSpellsButton" class="heraldHud-preparedSpellsButton">
        </div>
        <img
          src="/modules/herald-hud-beta/assets/spellsprep_img.webp"
          alt=""
          class="heraldHud-preparedSpellsImage"
        />
      </div>
      <div class="heraldHud-preparedSpellsTooltip">Prepared Spells</div>
    </div>
    `;

    let preparedSpellsWrapper = document.getElementById(
      "heraldHud-preparedSpellsWrapper"
    );

    if (preparedSpellsWrapper) {
      preparedSpellsWrapper.addEventListener("click", (event) => {
        event.stopPropagation();
        heraldHud_showDialog("spellsPrep");
      });
    }
  } else {
    if (preparedSpellsActionContainerDiv) {
      preparedSpellsActionContainerDiv.innerHTML = ``;
    }
  }

  let restShortcutContainerDiv = document.getElementById(
    "heraldHud-restShortcutContainer"
  );
  if (restShortcutContainerDiv) {
    restShortcutContainerDiv.innerHTML = `
    <div id="heraldHud-shortRestContainer" class="heraldHud-shortRestContainer" >
      <div id="heraldHud-shortRestButton" class="heraldHud-shortRestButton">
        <i class="fa-solid fa-utensils"></i>
      </div>
      <div class="heraldHud-shortRestTooltip">Short Rest</div>
    </div>
    <div id="heraldHud-longRestContainer" class="heraldHud-longRestContainer">
      <div id="heraldHud-longRestButton" class="heraldHud-longRestButton">
        <i class="fa-solid fa-tent"></i>
      </div>
      <div class="heraldHud-longRestTooltip">Long Rest</div>
    </div>`;
  }

  let equipmentShortcutContainerDiv = document.getElementById(
    "heraldHud-equipmentShortcutContainer"
  );

  if (equipmentShortcutContainerDiv) {
    equipmentShortcutContainerDiv.innerHTML = `
    <div id="heraldHud-equipmentContainer" class="heraldHud-equipmentContainer">
      <div id="heraldHud-equipmentButton" class="heraldHud-equipmentButton">
        <i class="fa-regular fa-backpack"></i>
      </div>
      <div class="heraldHud-equipmentTooltip">Equipment</div>
    </div>
    `;
  }

  let settingHudContainerDiv = document.getElementById(
    "heraldHud-settingHudContainer"
  );

  if (settingHudContainerDiv) {
    settingHudContainerDiv.innerHTML = `
    <div id="heraldHud-settingContainer" class="heraldHud-settingContainer">
      <div id="heraldHud-settingButton" class="heraldHud-settingButton">
        <i class="fa-solid fa-gear"></i>
      </div>
      <div class="heraldHud-settingTooltip">Setting</div>
    </div>
    `;

    let settingHudButton = document.getElementById("heraldHud-settingButton");

    if (settingHudButton) {
      settingHudButton.addEventListener("click", (event) => {
        event.stopPropagation();
        heraldHud_openSettingHudDialog();
      });
    }
  }

  setTimeout(() => {
    const shortRestButton = document.getElementById(
      "heraldHud-shortRestContainer"
    );
    const longRestButton = document.getElementById(
      "heraldHud-longRestContainer"
    );

    if (shortRestButton) {
      shortRestButton.addEventListener("click", async () => {
        if (heraldHud_actorSelected) {
          await heraldHud_actorSelected.shortRest();
        }
      });
    }

    if (longRestButton) {
      longRestButton.addEventListener("click", async () => {
        if (heraldHud_actorSelected) {
          await heraldHud_actorSelected.longRest();
        }
      });
    }
  }, 500);

  const summonContainer = document.getElementById(
    "heraldHud-addSummonContainer"
  );
  if (summonContainer) {
    summonContainer.innerHTML = `
      <div id="heraldHud-addSummonerButton" class="heraldHud-addSummonerButton">
        <i class="fa-solid fa-plus"></i>
      </div>
    `;

    summonContainer.addEventListener("click", async () => {
      await heraldHud_showDialogAddSummon();
    });
  }
}

async function heraldHud_showDialogAddSummon() {
  let sceneListActor = game.scenes.viewed.tokens
  .filter((t) => t.actor.type === "npc")
  .map((t) => t.actor);
  const user = game.user;
  let listDataNpcPlayer = [];
  for (let actor of sceneListActor) {
    if (actor.ownership[user.id]) {
      if (actor.ownership[user.id] == 3) {
        listDataNpcPlayer.push(actor);
      }
    }
  }
  let listNpcPlayer = ``;
  for(let npc of listDataNpcPlayer){

    let currentHp = npc.system.attributes.hp.value;  
    let maxHp = npc.system.attributes.hp.max;       
    let token = npc.getActiveTokens()[0];
    let isLinked = token?.document.actorLink;
    let linkActorDataDiv = ``;
    if(isLinked){
      linkActorDataDiv = `<div id="heraldHud-dialogNpcLinkActorData" class="heraldHud-dialogNpcLinkActorData" style="color:green;">Actor Data is Link</div>`;
    }else{
      linkActorDataDiv = `<div id="heraldHud-dialogNpcLinkActorData" class="heraldHud-dialogNpcLinkActorData" style="color:red;">Actor data is not link! (Check with Dungeon Master!)</div>`;
    }

    let npcCr = npc.system.details?.cr
    console.log(isLinked);
    listNpcPlayer+=`
    <div id="heraldHud-dialogNpcContainer" class="heraldHud-dialogNpcContainer">
        <div id="heraldHud-dialogNpcLeft" class="heraldHud-dialogNpcLeft">
          <div class="heraldHud-dialogNpcImageContainer">
            <img src="${npc.img}" alt="" class="heraldHud-dialogNpcImageView" />
          </div>
          <div class="heraldHud-dialogNpcCr">
            CR ${npcCr}
          </div>
        </div>
        <div id="heraldHud-dialogNpcMiddle" class="heraldHud-dialogNpcMiddle">
          <div id="heraldHud-dialogNpcName" class="heraldHud-dialogNpcName">${npc.name}</div>
          <div id="heraldHud-dialogNpcUuid" class="heraldHud-dialogNpcUuid">${npc.id}</div>
          ${linkActorDataDiv}
          <div id="heraldHud-dialogNpcHp" class="heraldHud-dialogNpcHp">HP: ${currentHp}/${maxHp}</div>
        </div>
         <div id="heraldHud-dialogNpcRight" class="heraldHud-dialogNpcRight">
          <label>
            <input type="checkbox" class="heraldHud-dialogNpcCheckbox" >
          </label>
        </div>
    </div>`;
  }


  let dialogContent = `
  <div id="heraldHud-dialogListNpcContainer" class="heraldHud_dialogListNpcContainer">
    ${listNpcPlayer}
  </div>`
  new Dialog({
    title: "Add Summon",
    content: dialogContent,
    buttons: {
      save: {
        label: "Save",
      },
      cancel: {
        label: "Cancel",
      },
    },
    default: "add",
  }).render(true);
}

async function heraldHud_updateEndTurnButton() {
  let actor = heraldHud_actorSelected;
  let endturnShortcutContainerDiv = document.getElementById(
    "heraldHud-endturnShortcutContainer"
  );

  if (!endturnShortcutContainerDiv || !actor) {
    if (endturnShortcutContainerDiv)
      endturnShortcutContainerDiv.style.display = "none";
    return;
  }

  const combat = game.combat;
  if (!combat) {
    endturnShortcutContainerDiv.style.display = "none";
    return;
  }

  const currentCombatant = combat.combatant;
  const isActorTurn = currentCombatant?.actor?.id === actor.id;

  if (isActorTurn) {
    endturnShortcutContainerDiv.innerHTML = `
      <div id="heraldHud-endturnContainer" class="heraldHud-endturnContainer">
        <div id="heraldHud-endturnButton" class="heraldHud-endturnButton">
          End Turn
        </div>
      </div>
    `;
    endturnShortcutContainerDiv.style.display = "flex";

    document
      .getElementById("heraldHud-endturnButton")
      .addEventListener("click", async () => {
        await combat.nextTurn();
      });
  } else {
    endturnShortcutContainerDiv.innerHTML = "";
    endturnShortcutContainerDiv.style.display = "none";
  }
}

Hooks.on("updateCombat", heraldHud_updateEndTurnButton);
Hooks.on("createCombat", heraldHud_updateEndTurnButton);
Hooks.on("deleteCombat", heraldHud_updateEndTurnButton);

async function heraldHud_updateDataActor() {
  let actor = heraldHud_actorSelected;

  let hpValueInput = document.getElementById("heraldHud-hpValueInput");
  let tempHpValueInput = document.getElementById("heraldHud-tempHpValueInput");
  function updateHpValue() {
    let inputValue = hpValueInput.value.trim();
    if (inputValue === "") return;

    let newHp = parseInt(actor.system.attributes.hp.value) || 0;
    let changeValue = parseInt(inputValue);

    if (!isNaN(changeValue)) {
      newHp =
        inputValue.startsWith("+") || inputValue.startsWith("-")
          ? newHp + changeValue
          : changeValue;

      newHp = Math.min(newHp, totalMaxHp);

      actor.update({ "system.attributes.hp.value": newHp });
      hpValueInput.value = newHp;
    }
  }

  function delayedUpdate() {
    clearTimeout(hpValueInput.delayTimer);
    hpValueInput.delayTimer = setTimeout(updateHpValue, 500);
  }

  hpValueInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      delayedUpdate();
    }
  });

  //  temp input
  tempHpValueInput.addEventListener("input", function () {
    clearTimeout(tempHpValueInput.delayTimer);
    tempHpValueInput.delayTimer = setTimeout(async function () {
      let newTempHp = tempHpValueInput.value;
      if (newTempHp === "" || newTempHp === "0") {
        tempHpValueInput.value = "";
        await actor.update({ "system.attributes.hp.temp": "" });
      } else if (!isNaN(newTempHp)) {
        if (newTempHp > totalMaxHp) {
          newTempHp = totalMaxHp;
        }
        await actor.update({ "system.attributes.hp.temp": newTempHp });
        tempHpValueInput.value = newTempHp;
      }
    }, 500);
  });

  const hp = actor.system.attributes.hp.value;
  const maxHp = actor.system.attributes.hp.max;
  let tempHp = actor.system.attributes.hp.temp || 0;

  const tempmaxhp = actor.system.attributes.hp.tempmax || 0;

  const totalMaxHp = maxHp + tempmaxhp;
  const hpPercent = (hp / totalMaxHp) * 100;
  const tempPercent = (tempHp / totalMaxHp) * 100;
  let acValue = actor.system.attributes.ac.value;
  if (tempHp > totalMaxHp) {
    tempHp = totalMaxHp;
    actor.update({
      "system.attributes.hp.temp": totalMaxHp,
    });
  }

  let hpBarDiv = document.getElementById("heraldHud-actorHpBar");
  let hpBarDelayDiv = document.getElementById("heraldHud-actorHpBarDelay");
  let hpGradientColor = document.getElementById("heraldHud_hpGradient");

  if (hpBarDiv) {
    if (hp >= 0) {
      let strokeValue = 310 - hpPercent * 1.1;

      hpBarDiv.style.strokeDashoffset = Math.max(strokeValue, 200);

      setTimeout(() => {
        hpBarDelayDiv.style.strokeDashoffset = Math.max(strokeValue, 200);
      }, 500);

      if (hpPercent < 0) {
        hpGradientColor.innerHTML = `
        <stop offset="75%" stop-color="${hp0}" />
        <stop offset="100%" stop-color="${darkenHex(hp0, 40)}"/>`;
      } else if (hpPercent <= 25) {
        hpGradientColor.innerHTML = `
        <stop offset="75%" stop-color="${hp25}" />
        <stop offset="100%" stop-color="${darkenHex(hp25, 40)}"/>`;
      } else if (hpPercent <= 50) {
        hpGradientColor.innerHTML = `
        <stop offset="75%" stop-color="${hp50}" />
        <stop offset="100%" stop-color="${darkenHex(hp50, 40)}"/>`;
      } else if (hpPercent <= 75) {
        hpGradientColor.innerHTML = `
        <stop offset="75%" stop-color="${hp75}" />
        <stop offset="100%" stop-color="${darkenHex(hp75, 40)}"/>`;
      } else {
        hpGradientColor.innerHTML = `
        <stop offset="75%" stop-color="${hp100}" />
        <stop offset="100%" stop-color="${darkenHex(hp100, 40)}"/>`;
      }
      if (hpValueInput) {
        hpValueInput.value = hp;
      }
    } else {
      let temphpValue = hp;
      let negativeBlockMax = hp + totalMaxHp;
      if (negativeBlockMax < 0) {
        temphpValue = totalMaxHp * -1;

        await actor.update({
          "system.attributes.hp.value": temphpValue,
        });
      }
      const negativeHpPercent = (temphpValue / totalMaxHp) * -100;

      let strokeValue = 310 - negativeHpPercent * 1.1;

      hpBarDiv.style.strokeDashoffset = Math.max(strokeValue, 200);
      if (negativeHpPercent > 0) {
        hpGradientColor.innerHTML = `
        <stop offset="70%" stop-color="${hp0}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      }

      setTimeout(() => {
        hpBarDelayDiv.style.strokeDashoffset = Math.max(strokeValue, 200);
      }, 500);

      if (hpValueInput) {
        hpValueInput.value = temphpValue;
      }
    }
  }

  let hpMaxValueDiv = document.getElementById("heraldHud-hpMaxValue");

  if (hpMaxValueDiv) {
    hpMaxValueDiv.innerText = "/ " + totalMaxHp;
  }
  let tempMaxHpValueDiv = document.getElementById("heraldHud-tempHpMaxValue");
  if (tempmaxhp) {
    if (tempMaxHpValueDiv) {
      if (tempmaxhp > 0) {
        tempMaxHpValueDiv.innerText = `(+${tempmaxhp})`;
        tempMaxHpValueDiv.style.color = "#05b4ff";
      } else {
        tempMaxHpValueDiv.innerText = `(${tempmaxhp})`;
        tempMaxHpValueDiv.style.color = "#b0001d";
      }
    }
  } else {
    if (tempMaxHpValueDiv) {
      tempMaxHpValueDiv.innerText = "";
    }
  }
  let tempPlusIconDiv = document.getElementById("heraldHud-tempPlusIcon");
  let tempHpBarLeftDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);

  let tempHpBarRightDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);
  let tempHpCircleLeftDiv = document.getElementById("heraldHud-tempHpLeft");
  let tempHpCircleRightDiv = document.getElementById("heraldHud-tempHpRight");

  let tempShieldContainerDiv = document.getElementById(
    "heraldHud-tempShieldContainer"
  );
  if (tempHp > 0 || tempHp != "") {
    let tempHpBarContainerDiv = document.getElementById(
      "heraldHud-tempHpBarContainer"
    );

    if (tempPlusIconDiv) {
      tempPlusIconDiv.innerText = `+`;
    }
    if (tempHpValueInput) {
      tempHpValueInput.value = tempHp;
    }
    let actorTempValuebar = 0;
    actorTempValuebar = 300 - tempPercent;
    if (tempShieldContainerDiv) {
      tempShieldContainerDiv.innerHTML = `<img src="/modules/herald-hud-beta/assets/tempshield_icon.png" alt="shield" class="heraldHud-tempShieldImage" />`;
    }
    if (!tempHpBarLeftDiv && !tempHpBarRightDiv) {
      if (tempHpBarContainerDiv) {
        tempHpBarContainerDiv.innerHTML = `
        <div class="heraldHud-tempHpBarLeft">
              <svg
                width="150"
                height="150"
                viewBox="0 0 100 100"
                class="heraldHud-actorTempHpSvg"
              >
                <defs>
                  <linearGradient id="heraldHud_tempHpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="60%" stop-color="rgb(26, 209, 255)" />
                     <stop offset="100%" stop-color="rgb(199, 244, 255)"/>
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  id="heraldHud-tempHpLeft"
                  class="heraldHud-tempHpLeft"
                  stroke="url(#heraldHud_tempHpGradient)"
                  stroke-dasharray="310"
                  stroke-dashoffset="${actorTempValuebar}"
                />
              </svg>
            </div>
            <div class="heraldHud-tempHpBarRight">
              <svg
                width="110"
                height="110"
                viewBox="0 0 100 100"
                class="heraldHud-actorTempHpSvg"
              >

                 <defs>
                  <linearGradient id="heraldHud_tempHpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="60%" stop-color="rgb(26, 209, 255)" />
                     <stop offset="100%" stop-color="rgb(199, 244, 255)"/>
                  </linearGradient>
                </defs>

                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  id="heraldHud-tempHpRight"
                  class="heraldHud-tempHpRight"
                  stroke="url(#heraldHud_tempHpGradient)"
                  stroke-dasharray="310"
                  stroke-dashoffset="${actorTempValuebar}"
                />
              </svg>
            </div>
        `;
      }
    } else {
      if (tempHpCircleLeftDiv) {
        tempHpCircleLeftDiv.style.strokeDashoffset = actorTempValuebar;
      }
      if (tempHpCircleRightDiv) {
        tempHpCircleRightDiv.style.strokeDashoffset = actorTempValuebar;
      }
    }
  } else {
    if (tempPlusIconDiv) {
      tempPlusIconDiv.innerText = ``;
    }

    if (tempHpCircleLeftDiv) {
      tempHpCircleLeftDiv.style.strokeDashoffset = 310;
    }
    if (tempHpCircleRightDiv) {
      tempHpCircleRightDiv.style.strokeDashoffset = 310;
    }

    if (tempHpValueInput) {
      tempHpValueInput.value = "";
    }
    if (tempShieldContainerDiv) {
      tempShieldContainerDiv.innerHTML = ``;
    }
  }

  let acValueDiv = document.getElementById("heraldHud-acValue");
  if (acValueDiv) {
    acValueDiv.innerText = acValue;
  }

  let initiativeContainerDiv = document.getElementById(
    "heraldHud-initiativeContainer"
  );
  let initiativeValueDiv = document.getElementById("heraldHud-initiativeValue");
  initiativeContainerDiv.addEventListener("click", async () => {
    actor.rollInitiativeDialog();
  });

  let initiativeValue = actor.system.attributes.init.total;

  if (initiativeValueDiv) {
    if (initiativeValue >= 0) {
      initiativeValueDiv.innerText = `+${initiativeValue}`;
    } else {
      initiativeValueDiv.innerText = `${initiativeValue}`;
    }
  }
}
async function heraldHud_universalChecker() {
  if (heraldHud_checkerValue) {
    clearInterval(heraldHud_checkerValue);
  }
  await heraldHud_updateEffectActor();
  heraldHud_checkerValue = setInterval(async () => {
    await heraldHud_updateEffectActor();
    await heraldHud_updateItemCosumablesActor();
  }, 1000);
}
async function heraldHud_updateEffectActor() {
  let actor = heraldHud_actorSelected;
  let effectlist = ``;
  let arrEffect = [];

  for (let effect of actor.effects) {
    arrEffect.push(effect);
  }
  for (let item of actor.items) {
    if (item.effects) {
      for (let effect of item.effects) {
        arrEffect.push(effect);
      }
    }
  }

  let activeEffect = ``;
  let disableEffect = ``;

  arrEffect.forEach((effect) => {
    if (effect.target !== actor) {
      return;
    }
    let stackDiv = "";
    if (/\(\d+\)/.test(effect.name)) {
      const match = effect.name.match(/\((\d+)\)/);
      if (match) {
        const number = parseInt(match[1], 10);
        stackDiv = `<div class="heraldHud-stackEffect">${number}</div>`;
      }
    }

    let durationDiv = "";
    if (effect.duration.rounds > 0) {
      durationDiv = `
            <div class="heraldHud-detailEffectDuration">
              ${effect.duration.rounds} rounds
            </div>`;
    }
    let effectDisabled = "";

    if (effect.disabled) {
      effectDisabled = `<div class="heraldHud-detailEffectDisable">Disabled</div>`;
    }

    const effectDetailDiv = `
      <div class="heraldHud-effectTooltip" style="display: none;">
        <h3>${effect.name}</h3>
        <div>
          <div>${effect.description}</div>
        </div>
        <div id="heraldHud-detailEffectBottom" class="heraldHud-detailEffectBottom">
          <div id="heraldHud-detailEffectType" class="heraldHud-detailEffectType">
            ${effect.isTemporary ? "Temporary" : "Passive"}
          </div>
          ${durationDiv}
          ${effectDisabled}
        </div>
      </div>`;

    if (!effect.disabled) {
      activeEffect += `
         <div id="heraldHud-effectContainer" data-effect-id="${
           effect.id
         }" class="heraldHud-effectContainer">
          <div class="heraldHud-effectItem">
            <img src="${effect.img}" alt="${effect.name}" 
            class="heraldHud-playerEffect" ${
              effect.disabled
                ? 'style="filter: brightness(85%); opacity: 0.7;"'
                : ""
            } />
            ${stackDiv}
          </div>
          ${effectDetailDiv}
        </div>`;
    } else {
      disableEffect += `
        <div id="heraldHud-effectContainer" data-effect-id="${
          effect.id
        }" class="heraldHud-effectContainer">
          <div class="heraldHud-effectItem">
            <img src="${effect.img}" alt="${effect.name}" 
            class="heraldHud-playerEffect" ${
              effect.disabled
                ? 'style="filter: brightness(85%); opacity: 0.7;"'
                : ""
            } />
            ${stackDiv}
          </div>
          ${effectDetailDiv}
        </div>
      `;
    }
  });
  effectlist = activeEffect + disableEffect;

  if (effectlist == ``) {
    effectlist = `
      <div>
        <div class="heraldHud-playerEffect" style="opacity: 0;"></div>
      </div>`;
  }

  let listEffectDiv = document.getElementById("heraldHud-listEffectContainer");

  if (listEffectDiv) {
    listEffectDiv.innerHTML = effectlist;

    document.querySelectorAll(".heraldHud-effectContainer").forEach((item) => {
      const detailDiv = item.querySelector(".heraldHud-effectTooltip");

      if (!item.hasAttribute("data-hover-listener")) {
        item.addEventListener("mouseenter", () => {
          if (detailDiv) detailDiv.style.display = "block";
        });
        item.addEventListener("mouseleave", () => {
          if (detailDiv) detailDiv.style.display = "none";
        });
        item.setAttribute("data-hover-listener", "true");
      }

      if (!item.hasAttribute("data-contextmenu-listener")) {
        item.addEventListener("contextmenu", function (event) {
          event.preventDefault();
          const actorUuid = actor.uuid;
          const effectId = this.getAttribute("data-effect-id");

          heraldHud_settingEffect(effectId, actorUuid);
        });
        item.setAttribute("data-contextmenu-listener", "true");
      }
    });
  }
}

let heraldHud_effectDialog = false;
async function heraldHud_settingEffect(effectId, actorUuid) {
  if (heraldHud_effectDialog) {
    console.log("Dialog already open, preventing duplicate.");
    return;
  }

  const actor = canvas.tokens.placeables.find(
    (token) => token.actor.uuid === actorUuid
  )?.actor;

  if (!actor) {
    console.error("Actor not found");
    return;
  }

  const arrEffect = [];

  for (let effect of actor.effects) {
    arrEffect.push(effect);
  }

  for (let item of actor.items) {
    if (item.effects) {
      for (let effect of item.effects) {
        arrEffect.push(effect);
      }
    }
  }

  const effectToDelete = arrEffect.find((effect) => effect.id === effectId);

  if (!effectToDelete) {
    console.error("Effect not found");
    return;
  }

  heraldHud_effectDialog = true;

  const isDisabled = effectToDelete.disabled;
  const isTemporary = effectToDelete.isTemporary;

  const dialogContent = `
    <p>What would you like to do with the effect <b>${effectToDelete.name}</b> on actor <b>${actor.name}</b>?</p>
  `;

  const buttons = {};

  if (isTemporary) {
    buttons.delete = {
      label: "Delete",
      callback: () => {
        effectToDelete.delete();
        heraldHud_updateEffectActor();
        heraldHud_effectDialog = false;
      },
    };
  }

  buttons.disableEnable = {
    label: isDisabled ? "Enable" : "Disable",
    callback: () => {
      effectToDelete.update({ disabled: !isDisabled });
      const action = isDisabled ? "enabled" : "disabled";
      heraldHud_updateEffectActor();
      heraldHud_effectDialog = false;
    },
  };

  buttons.cancel = {
    label: "Cancel",
    callback: () => {
      heraldHud_effectDialog = false;
    },
  };

  const dialog = new Dialog({
    title: "Manage Effect",
    content: dialogContent,
    buttons: buttons,
    default: "cancel",
    close: () => {
      heraldHud_effectDialog = false;
      console.log("Dialog closed");
    },
  });

  dialog.render(true);
}

async function heraldHud_updateMovementsActor() {
  let actor = heraldHud_actorSelected;
  let walkSpeedValueDiv = document.getElementById("heraldHud-walkSpeedValue");
  let movementSpeedContainerIcon = document.getElementById(
    "heraldHud-speedIconContainer"
  );
  let walkSpeedValue = actor.system.attributes.movement.walk;
  let burrowSpeedValue = ``;
  let climbSpeedValue = ``;
  let flySpeedValue = ``;
  let swimSpeedValue = ``;
  let movementUnits = actor.system.attributes.movement.units;
  let movementHover = actor.system.attributes.movement.hover;
  if (walkSpeedValueDiv) {
    walkSpeedValueDiv.innerText = `${walkSpeedValue} ${movementUnits}`;
  }

  if (actor.system.attributes.movement.burrow) {
    burrowSpeedValue = `
      <div id="heraldHud-burrowSpeedContainer" class="heraldHud-burrowSpeedContainer">
        <div id="heraldHud-burrowSpeedWrapper" class="heraldHud-burrowSpeedWrapper">
          <div id="heraldHud-burrowSpeedIcon" class="heraldHud-burrowSpeedIcon">
            <i class="fa-solid fa-shovel"></i>
            <div class="heraldHud-speedTooltip">Burrow</div>
          </div>
          <div id="heraldHud-burrowSpeedValue" class="heraldHud-burrowSpeedValue">${actor.system.attributes.movement.burrow}</div>
        </div>
      </div>
    `;
  }

  if (actor.system.attributes.movement.climb) {
    climbSpeedValue = `
     <div id="heraldHud-climbSpeedContainer" class="heraldHud-climbSpeedContainer">
        <div id="heraldHud-climbSpeedWrapper" class="heraldHud-climbSpeedWrapper">
          <div id="heraldHud-climbSpeedIcon" class="heraldHud-climbSpeedIcon"> 
            <i class="fa-solid fa-hill-rockslide"></i>
            <div class="heraldHud-speedTooltip">Climb</div>
          </div>
          <div id="heraldHud-climbSpeedValue" class="heraldHud-climbSpeedValue">${actor.system.attributes.movement.climb}</div>
        </div>
      </div>
    `;
  }

  if (actor.system.attributes.movement.fly) {
    flySpeedValue = `
     <div id="heraldHud-flySpeedContainer" class="heraldHud-flySpeedContainer">
        <div id="heraldHud-flySpeedWrapper" class="heraldHud-flySpeedWrapper">
          <div id="heraldHud-flySpeedIcon" class="heraldHud-flySpeedIcon"> 
            <i class="fa-solid fa-dove"></i>
            <div class="heraldHud-speedTooltip">Fly</div>
          </div>
          <div id="heraldHud-flySpeedValue" class="heraldHud-flySpeedValue">${actor.system.attributes.movement.fly}</div>
        </div>
      </div>
    `;
  }

  if (actor.system.attributes.movement.swim) {
    swimSpeedValue = `
     <div id="heraldHud-swimSpeedContainer" class="heraldHud-swimSpeedContainer">
        <div id="heraldHud-swimSpeedWrapper" class="heraldHud-swimSpeedWrapper">
          <div id="heraldHud-swimSpeedIcon" class="heraldHud-swimSpeedIcon"> 
            <i class="fa-solid fa-person-swimming"></i>
            <div class="heraldHud-speedTooltip">Swim</div>
          </div>
          <div id="heraldHud-swimSpeedValue" class="heraldHud-swimSpeedValue">${actor.system.attributes.movement.swim}</div>
        </div>
      </div>
    `;
  }

  if (movementSpeedContainerIcon) {
    movementSpeedContainerIcon.innerHTML = `
    ${burrowSpeedValue}
    ${climbSpeedValue}
    ${flySpeedValue}
    ${swimSpeedValue}
    `;
  }
}

async function heraldHud_updateItemFavoriteActor() {
  let actor = heraldHud_actorSelected;
  let favoritesActor = actor.system?.favorites;
  let favoritesListDiv = document.getElementById("heraldHud-favoritesListItem");
  let listFavorites = ``;
  for (let favorite of favoritesActor) {
    let rawItemId = favorite.id.replace(".Item.", "");
    let item =
      actor.items.get(rawItemId) ||
      actor.getEmbeddedDocument("Item", rawItemId);
    listFavorites += `
    <div class="heraldHud-favoriteItem" data-item-id="${item.id}" data-name="${item.name}">
      <img src="${item.img}" alt="${item.name}" class="heraldHud-favoriteItemImage">
    </div>`;
  }

  if (favoritesListDiv) {
    favoritesListDiv.innerHTML = listFavorites;
    document.querySelectorAll(".heraldHud-favoriteItem").forEach((favItem) => {
      const tooltipDiv = document.getElementById(
        "heraldHud-favoriteItemTooltip"
      );
      const tooltipTypeDiv = document.getElementById(
        "heraldHud-favoriteTooltipTypeItem"
      );
      const tooltipNameDiv = document.getElementById(
        "heraldHud-favoriteTooltipNameItem"
      );
      const tooltipChargeDiv = document.getElementById(
        "heraldHud-favoriteTooltipChargeItem"
      );
      const tooltipMiddleDiv = document.getElementById(
        "heraldHud-favoriteTooltipMiddle"
      );
      favItem.addEventListener("click", async function () {
        let itemId = favItem.getAttribute("data-item-id");

        let item =
          actor.items.get(itemId) || actor.getEmbeddedDocument("Item", itemId);

        if (item) {
          await item.use();
          let favoriteUses = "";
          if (item.system.uses?.max) {
            favoriteUses = `- (${item.system.uses.value}/${item.system.uses.max})`;
          }
          tooltipChargeDiv.innerText = favoriteUses;
        }
      });

      favItem.addEventListener("mouseenter", (event) => {
        let itemId = favItem.getAttribute("data-item-id");

        let item =
          actor.items.get(itemId) || actor.getEmbeddedDocument("Item", itemId);
        let arrProperti = [];
        let labelProperti = "";

        if (item.labels.toHit) {
          arrProperti.push(`To hit ${item.labels.toHit}`);
        }
        if (item.labels.save) {
          arrProperti.push(item.labels.save);
        }
        if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
          if (item.labels.damages) {
            for (let damage of item.labels.damages) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        } else {
          if (item.labels.damage) {
            for (let damage of item.labels.derivedDamage) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        }

        if (arrProperti.length > 0) {
          labelProperti = arrProperti.join(" | ");
        }

        let favoriteUses = "";

        if (item.system.uses?.max) {
          favoriteUses = `- (${item.system.uses.value}/${item.system.uses.max})`;
        }

        let category = ``;
        if (item.system.activation.type == "action") {
          category = `<i class="fa-solid fa-circle" style="color:#1f6237;" ></i>`;
        } else if (item.system.activation.type.includes("bonus")) {
          category = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i>`;
        } else if (item.system.activation.type.includes("reaction")) {
          category = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i>`;
        } else if (item.system.activation.type.includes("legendary")) {
          category = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i>`;
        } else if (item.system.activation.type.includes("lair")) {
          category = `<i class="fa-solid fa-chess-rook" style="color:#c7cad6;"></i>`;
        } else if (item.system.activation.type.includes("mythic")) {
          category = `<i class="fa-solid fa-spaghetti-monster-flying" style="color:#adffeb;"></i>`;
        } else if (item.system.activation.type.includes("minute")) {
          category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i>`;
        } else if (item.system.activation.type.includes("hour")) {
          category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i>`;
        } else if (item.system.activation.type.includes("day")) {
          category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i>`;
        } else if (item.system.activation.type.includes("special")) {
          category = `<i class="fa-solid fa-sparkles" style="color:#d0f4fc;"></i>`;
        }

        let itemRarity = item.system?.rarity || "Unknown";
        let rarityColors = {
          common: "#b5bda6",
          uncommon: "#78c178",
          rare: "#6464bd",
          veryrare: "#62c1ad",
          legendary: "#bb9348",
          artifact: "#a46b43",
        };

        if (itemRarity != "Unknown") {
          if (rarityColors[itemRarity.toLowerCase()]) {
            let color = rarityColors[itemRarity.toLowerCase()];
            tooltipNameDiv.style.color = color;
            tooltipDiv.style.border = `2px solid ${color}`;
            tooltipChargeDiv.style.color = color;
          }
        } else {
          tooltipNameDiv.style.color = "white";
          tooltipDiv.style.border = ``;
          tooltipChargeDiv.style.color = "white";
        }

        let itemName = favItem.getAttribute("data-name");
        tooltipTypeDiv.innerHTML = category;
        tooltipNameDiv.innerText = itemName;
        tooltipChargeDiv.innerText = favoriteUses;
        tooltipMiddleDiv.innerHTML = labelProperti;
        tooltipDiv.style.opacity = "1";
        tooltipDiv.style.visibility = "visible";
      });

      favItem.addEventListener("mouseleave", () => {
        tooltipDiv.style.opacity = "0";
        tooltipDiv.style.visibility = "hidden";
      });
    });
  }
}

async function heraldHud_updateItemCosumablesActor() {
  let actor = heraldHud_actorSelected;
  let listConsumableItemDiv = document.getElementById(
    "heraldHud-listConsumableItem"
  );
  let listConsumableItem = "";
  let consumablesItem = actor.items.filter(
    (item) => item.type === "consumable"
  );
  consumablesItem.forEach((item) => {
    let validTypes = ["potion", "poison", "scroll"];
    if (!validTypes.includes(item.system.type.value)) return;
    let itemName = `${item.name}`;
    listConsumableItem += `
      <div class="heraldHud-consumableItem" data-item-id="${item.id}" data-name="${itemName}">
        <div class="heraldHud-consumableItemWrapper">
         <img src="${item.img}" alt="${item.name}" class="heraldHud-consumableItemImage">
         <div id="heraldHud-consumableItemQty-${item.id}" class="heraldHud-consumableItemQty">${item.system.quantity}</div>
        </div>
      </div>`;
  });
  if (listConsumableItemDiv) {
    listConsumableItemDiv.innerHTML = listConsumableItem;
    document
      .querySelectorAll(".heraldHud-consumableItem")
      .forEach((favItem) => {
        const tooltipDiv = document.getElementById(
          "heraldHud-consumableItemTooltip"
        );
        const tooltipNameDiv = document.getElementById(
          "heraldHud-consumableTooltipNameItem"
        );
        const tooltipQtyDiv = document.getElementById(
          "heraldHud-consumableTooltipQtyItem"
        );
        const tooltipChargeDiv = document.getElementById(
          "heraldHud-consumableTooltipChargeItem"
        );
        const tooltipMiddleDiv = document.getElementById(
          "heraldHud-consumableTooltipMiddle"
        );
        favItem.addEventListener("click", async function () {
          let itemId = this.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);

          if (item) {
            await item.use();
            let updatedItem =
              actor.items.get(itemId) ||
              actor.getEmbeddedDocument("Item", itemId);
            if (updatedItem) {
              let qtyConsumableDiv = document.getElementById(
                `heraldHud-consumableItemQty-${item.id}`
              );
              if (qtyConsumableDiv) {
                qtyConsumableDiv.innerText = `x${updatedItem.system.quantity}`;
              }

              if (tooltipQtyDiv) {
                tooltipQtyDiv.innerText = `(x${updatedItem.system.quantity})`;
              }

              let consumableCharge = "";

              if (
                updatedItem.system.uses?.value != null &&
                updatedItem.system.uses?.max != null &&
                !(
                  updatedItem.system.uses.max === 1 &&
                  updatedItem.system.uses.value === 1
                )
              ) {
                consumableCharge = `| (${updatedItem.system.uses.value}/${updatedItem.system.uses.max})`;
              }
              if (tooltipChargeDiv) {
                tooltipChargeDiv.innerText = consumableCharge;
              }
            }
          }
        });

        favItem.addEventListener("mouseenter", (event) => {
          let itemId = favItem.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);
          let arrProperti = [];
          let labelProperti = "";
          if (item.labels.toHit) {
            arrProperti.push(`To hit ${item.labels.toHit}`);
          }
          if (item.labels.save) {
            arrProperti.push(item.labels.save);
          }
          if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
            if (item.labels.damages) {
              for (let damage of item.labels.damages) {
                let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
                arrProperti.push(`${damage.formula} ${damageIcon}`);
              }
            }
          } else {
            if (item.labels.damage) {
              for (let damage of item.labels.derivedDamage) {
                let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

                arrProperti.push(`${damage.formula} ${damageIcon}`);
              }
            }
          }
          if (arrProperti.length > 0) {
            labelProperti = arrProperti.join(" | ");
          }

          if (tooltipQtyDiv) {
            tooltipQtyDiv.innerText = `(x${item.system.quantity})`;
          }

          let consumableCharge = "";

          if (
            item.system.uses?.value != null &&
            item.system.uses?.max != null &&
            !(item.system.uses.max == 1 && item.system.uses.value == 1)
          ) {
            consumableCharge = `| (${item.system.uses.value}/${item.system.uses.max})`;
          }
          if (tooltipChargeDiv) {
            tooltipChargeDiv.innerText = consumableCharge;
          }
          let itemName = favItem.getAttribute("data-name");
          tooltipNameDiv.innerText = itemName;
          tooltipMiddleDiv.innerHTML = labelProperti;
          tooltipDiv.style.opacity = "1";
          tooltipDiv.style.visibility = "visible";
        });

        favItem.addEventListener("mouseleave", () => {
          tooltipDiv.style.opacity = "0";
          tooltipDiv.style.visibility = "hidden";
        });
      });
  }
}
let heraldHud_showDialogValue = false;
async function heraldHud_showDialog(kategori) {
  let actor = heraldHud_actorSelected;
  if (heraldHud_showDialogValue) {
    await heraldHud_resetDialog(kategori);
    heraldHud_showDialogValue = false;
  } else {
    await heraldHud_renderDialog(kategori);
    heraldHud_showDialogValue = true;
  }
  if (kategori == "inventory") {
    await heraldHud_renderItemInventory();
  } else if (kategori == "loot") {
    await heraldHud_renderItemLoots();
  } else if (kategori == "features") {
    await heraldHud_renderItemFeatures();
  } else if (kategori == "spells") {
    await heraldHud_renderContainerSpells();
  } else if (kategori == "stats") {
    await heraldHud_renderContainerStats();
  } else if (kategori == "spellsPrep") {
    await heraldHud_renderContainerSpellsPrep();
  }
}
async function heraldHud_renderDialog(kategori) {
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.style.display = "block";
    heraldHud_dialogDiv.className = "heraldHud-dialog";
    heraldHud_dialogDiv.classList.add(`${kategori}`);
  }
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");
  if (heraldHud_dialog2Div);
  {
    heraldHud_dialog2Div.className = "heraldHud-dialog2";
    if (kategori == "spells") {
      heraldHud_dialog2Div.style.display = "block";
      heraldHud_dialog2Div.classList.add(`${kategori}`);
    }
  }
}

async function heraldHud_resetDialog() {
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.className = "heraldHud-dialog";
    heraldHud_dialogDiv.style.display = "none";
  }
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");
  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.className = "heraldHud-dialog2";
    heraldHud_dialog2Div.style.display = "none";
  }
}
async function heraldHud_renderHtmlDialog() {
  try {
    const response = await fetch(
      "/modules/herald-hud-beta/templates/heraldHud-dialog.html"
    );
    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const heraldHud = div.firstChild;
    heraldHud.id = "heraldHud-dialogContainer";

    document.body.appendChild(heraldHud);
  } catch (err) {
    console.error("Failed to load template heraldHud.html:", err);
  }
}

async function heraldHud_renderItemInventory() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogItemInventory" class="heraldHud-dialogItemInventory">
      <div id="heraldHud-dialogListWeaponContainer" class="heraldHud-dialogListWeaponContainer">
        <div id="heraldHud-dialogWeaponTitle" class="heraldHud-dialogWeaponTitle">Weapons</div>
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListWeapon" class="heraldHud-dialogListWeapon">
      
        </div>
      </div>
      <div id="heraldHud-dialogListToolContainer" class="heraldHud-dialogListToolContainer">
        <div id="heraldHud-dialogToolTitle" class="heraldHud-dialogToolTitle">Tools</div>
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListTool" class="heraldHud-dialogListTool">
      
        </div>
      </div>
      <div id="heraldHud-dialogListConsumbleContainer" class="heraldHud-dialogListConsumbleContainer">
        <div id="heraldHud-dialogConsumableTitle" class="heraldHud-dialogConsumableTitle">Consumable</div>
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListConsumable" class="heraldHud-dialogListConsumable">
      
        </div>
      </div>
    </div>`;
  }
  await heraldHud_getDataInventory();
}

async function heraldHud_getDataInventory() {
  let actor = heraldHud_actorSelected;
  let heraldHud_listWeaponDiv = document.getElementById(
    "heraldHud-dialogListWeapon"
  );
  let listWeapons = ``;

  let weaponsItem = actor.items.filter((item) => item.type === "weapon");
  let favoritesActor = actor.system?.favorites || [];
  weaponsItem.forEach((item) => {
    let rawItemId = `.Item.${item.id}`;

    let isFavorited = favoritesActor.some(
      (favorite) => favorite.id === rawItemId
    )
      ? "favorited"
      : "";
    let isEquipped = item.system.equipped ? "equipped" : "";
    let htmlDescription = ``;
    if (item.system?.identified === false) {
      htmlDescription = item.system.unidentified.description;
    } else {
      htmlDescription = item.system.description.value;
    }
    let arrProperti = [];
    let labelProperti = "";

    if (item.labels.toHit) {
      arrProperti.push(`To hit ${item.labels.toHit}`);
    }
    if (item.labels.save) {
      arrProperti.push(item.labels.save);
    }
    if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
      if (item.labels.damages) {
        for (let damage of item.labels.damages) {
          let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
          arrProperti.push(`${damage.formula} ${damageIcon}`);
        }
      }
    } else {
      if (item.labels.damage) {
        for (let damage of item.labels.derivedDamage) {
          let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

          arrProperti.push(`${damage.formula} ${damageIcon}`);
        }
      }
    }
    if (arrProperti.length > 0) {
      labelProperti = arrProperti.join(" | ");
    }
    let arrPropertiTooltip = [];
    let labelPropertiTooltip = "";

    if (item.system.type.label) {
      arrPropertiTooltip.push(item.system.type.label);
    }
    if (item.system.equipped) {
      arrPropertiTooltip.push("Equipped");
    } else {
      arrPropertiTooltip.push("Not Equipped");
    }
    if (item.system.proficient == 1) {
      arrPropertiTooltip.push("Proficient");
    } else if (item.system.proficient == 0) {
      arrPropertiTooltip.push("Not Proficient");
    } else {
      let weaponProficiency = new Set(
        actor.system.traits.weaponProf?.value || []
      );
      if (
        (item.system.type.value &&
          weaponProficiency.some(
            (prof) => item.system.type.value.indexOf(prof) !== -1
          )) ||
        (item.system.type.baseItem &&
          weaponProficiency.some(
            (prof) => item.system.type.baseItem.indexOf(prof) !== -1
          ))
      ) {
        arrPropertiTooltip.push("Proficient");
      } else {
        arrPropertiTooltip.push("Not Proficient");
      }
    }
    if (item.system.activation?.type) {
      const cost = item.system.activation.cost;
      let type =
        item.system.activation.type.charAt(0).toUpperCase() +
        item.system.activation.type.slice(1);
      if (item.system.activation.type.toLowerCase() === "bonus") {
        type = "Bonus Action";
      }

      if (cost) {
        arrPropertiTooltip.push(`${cost} ${type}`);
      } else {
        arrPropertiTooltip.push(type);
      }
    }
    if (item.system.range?.value) {
      let rangeValue = `${item.system.range.value} ft`;
      if (item.system.range.long) {
        rangeValue = `${item.system.range.value} / ${item.system.range.long} ft`;
      }
      arrPropertiTooltip.push(rangeValue);
    }

    if (arrPropertiTooltip.length > 0) {
      labelPropertiTooltip = arrPropertiTooltip.join(" | ");
    }
    let arrWeaponCategory = [];
    let category = ``;
    if (item.system.activation.type == "action") {
      category = `<i class="fa-solid fa-circle" style="color:#1f6237;"></i> Action`;
    } else if (item.system.activation.type.includes("bonus")) {
      category = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i> Bonus Action`;
    } else if (item.system.activation.type.includes("reaction")) {
      category = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i> Reaction`;
    } else if (item.system.activation.type.includes("legendary")) {
      category = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i> Legendary Action`;
    } else if (item.system.activation.type.includes("lair")) {
      category = `<i class="fa-solid fa-chess-rook" style="color:#c7cad6;"></i> Lair Action`;
    } else if (item.system.activation.type.includes("mythic")) {
      category = `<i class="fa-solid fa-spaghetti-monster-flying" style="color:#adffeb;"></i> Mythic Action`;
    } else if (item.system.activation.type.includes("minute")) {
      category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Minute`;
    } else if (item.system.activation.type.includes("hour")) {
      category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Hour`;
    } else if (item.system.activation.type.includes("day")) {
      category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Day`;
    } else if (item.system.activation.type.includes("special")) {
      category = `<i class="fa-solid fa-sparkles" style="color:#d0f4fc;"></i> Special`;
    }

    if (category) {
      arrWeaponCategory.push(category);
    }
    let weaponitemUses = "";

    if (item.system.uses?.max) {
      weaponitemUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
    }

    if (weaponitemUses) {
      arrWeaponCategory.push(weaponitemUses);
    }

    let itemRarity = item.system?.rarity;
    let rarityColors = {
      common: "#b5bda6",
      uncommon: "#78c178",
      rare: "#6464bd",
      veryrare: "#62c1ad",
      legendary: "#bb9348",
      artifact: "#a46b43",
    };
    let nameColor = ``;
    let borderColor = ``;
    if (rarityColors[itemRarity.toLowerCase()]) {
      let color = rarityColors[itemRarity.toLowerCase()];
      nameColor = `color:${color};`;
      borderColor = `border:2px solid ${color};`;
    }

    listWeapons += `
      <div id="heraldHud-dialogWeaponContainer" class="heraldHud-dialogWeaponContainer">
        <div id="heraldHud-dialogWeaponItem" class="heraldHud-dialogWeaponItem" data-item-id="${item.id}">
            <div id="heraldHud-weaponLeft" class="heraldHud-weaponLeft">
                <div class="heraldHud-dialogWeaponImageContainer">
                   <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogWeaponImage" style="${borderColor}">
                </div>
            </div>
            <div id="heraldHud-weaponMiddle" class="heraldHud-weaponMiddle">
              <div id="heraldHud-weaponName" class="heraldHud-weaponName" style="${nameColor}">${item.name}</div>
              <div id="heraldHud-weaponCategory-${item.id}" class="heraldHud-weaponCategory">
                <div class="heraldHud-weaponsActiveType">${category} </div>
                <div id="heraldHud-weaponsUsesValue-${item.id}" class="heraldHud-weaponsUsesValue">${weaponitemUses}</div>
              </div>
              <div id class="heraldHud-weaponProperti">${labelProperti}</div>
            </div>
            <div id="heraldHud-weaponRight" class="heraldHud-weaponRight">
                <div class="heraldHud-weaponEquipButton ${isEquipped}" data-item-id="${item.id}">
                    <i class="fa-solid fa-shield-halved"></i>
                </div>
                <div class="heraldHud-weaponFavoriteButton ${isFavorited}" data-item-id="${item.id}">
                    <i class="fa-solid fa-star"></i>
                </div>
            </div>
        </div>
        <div id="heraldHud-dialogWeaponTooltip" class="heraldHud-dialogWeaponTooltip">
          <div class="heraldHud-weaponTooltipTop">${item.name}  
          <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
          <div class="heraldHud-weaponTooltipMiddle">${htmlDescription} 
          <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
          <div class="heraldHud-weaponTooltipBottom">${labelPropertiTooltip}</div>
        </div>
      </div>
      `;
  });

  if (heraldHud_listWeaponDiv) {
    heraldHud_listWeaponDiv.innerHTML = listWeapons;

    document
      .querySelectorAll(".heraldHud-dialogWeaponItem")
      .forEach((weaponItem) => {
        weaponItem.addEventListener("click", async function () {
          let itemId = this.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);
          if (item) {
            await item.use();
            let updatedItem =
              actor.items.get(itemId) ||
              actor.getEmbeddedDocument("Item", itemId);
            let weaponUsesDiv = document.getElementById(
              `heraldHud-weaponsUsesValue-${item.id}`
            );
            let weaponItemUses = "";

            if (updatedItem.system.uses?.max) {
              weaponItemUses = `${updatedItem.system.uses.value}/${updatedItem.system.uses.max}`;
            }
            if (weaponUsesDiv) {
              weaponUsesDiv.innerText = `| ${weaponItemUses}`;
            }
          }
        });
      });

    document.querySelectorAll(".heraldHud-weaponEquipButton").forEach((div) => {
      div.addEventListener("click", async (event) => {
        event.stopPropagation();
        let itemId = div.getAttribute("data-item-id");
        let item = actor.items.get(itemId);

        if (item) {
          let equipped = item.system.equipped;
          await item.update({ "system.equipped": !equipped });
          div.classList.toggle("equipped", !equipped);
        }
      });
    });

    document
      .querySelectorAll(".heraldHud-weaponFavoriteButton")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          let itemId = button.getAttribute("data-item-id");
          let rawItemId = `.Item.${itemId}`;
          let isCurrentlyFavorite = favoritesActor.some(
            (fav) => fav.id === rawItemId
          );

          if (isCurrentlyFavorite) {
            favoritesActor = favoritesActor.filter(
              (fav) => fav.id !== rawItemId
            );
          } else {
            let maxSort =
              favoritesActor.length > 0
                ? Math.max(...favoritesActor.map((fav) => fav.sort))
                : 0;
            favoritesActor.push({
              type: "item",
              id: rawItemId,
              sort: maxSort + 100000,
            });
          }
          if (Array.isArray(favoritesActor)) {
            await actor.update({ "system.favorites": favoritesActor });
          }

          button.classList.toggle("favorited", !isCurrentlyFavorite);
        });
      });
  }
  let heraldHud_listToolDiv = document.getElementById(
    "heraldHud-dialogListTool"
  );
  let listTools = ``;
  let toolsItem = actor.items.filter((item) => item.type === "tool");

  toolsItem.forEach((item) => {
    let rawItemId = `.Item.${item.id}`;

    let isFavorited = favoritesActor.some(
      (favorite) => favorite.id === rawItemId
    )
      ? "favorited"
      : "";
    let isEquipped = item.system.equipped ? "equipped" : "";
    let htmlDescription = ``;
    if (item.system?.identified === false) {
      htmlDescription = item.system.unidentified.description;
    } else {
      htmlDescription = item.system.description.value;
    }
    let arrToolCategory = [];
    let toolItemUses = "";

    if (item.system.type.label) {
      arrToolCategory.push(item.system.type.label);
    }
    if (item.system.uses?.max) {
      toolItemUses = `${item.system.uses.value}/${item.system.uses.max}`;
    }

    if (toolItemUses) {
      arrToolCategory.push(toolItemUses);
    }

    let labelCategory = ``;

    if (arrToolCategory.length > 0) {
      labelCategory = arrToolCategory.join(" | ");
    }
    listTools += ` 
    <div id="heraldHud-dialogToolContainer" class="heraldHud-dialogToolContainer">
        <div id="heraldHud-dialogToolItem" class="heraldHud-dialogToolItem" data-item-id="${item.id}">
          <div id="heraldHud-toolLeft" class="heraldHud-toolLeft">
            <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogToolImage">
          </div>
          <div id="heraldHud-toolMiddle" class="heraldHud-toolMiddle">
            <div id="heraldHud-toolName" class="heraldHud-toolName">${item.name}</div>
            <div id="heraldHud-toolCategory" class="heraldHud-toolCategory">${labelCategory}</div>
          </div>
          <div id="heraldHud-toolRight" class="heraldHud-toolRight">
        <div class="heraldHud-toolEquipButton ${isEquipped}" data-item-id="${item.id}">
                  <i class="fa-solid fa-shield-halved"></i>
              </div>
              <div class="heraldHud-toolFavoriteButton ${isFavorited}" data-item-id="${item.id}">
                  <i class="fa-solid fa-star"></i>
              </div>
          </div>
        </div>
      <div id="heraldHud-dialogToolTooltip" class="heraldHud-dialogToolTooltip">
        <div class="heraldHud-toolTooltipTop">
        ${item.name}  
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        </div>
        <div class="heraldHud-toolTooltipMiddle">
        ${htmlDescription}
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        </div>
        <div class="heraldHud-toolTooltipBottom"></div>
      </div>
    </div>
    `;
  });

  if (listTools == "") {
    listTools = `
    <div id="heraldHud-dialogToolItem" class="heraldHud-dialogToolItem" >
       -
    </div>
    `;
  }

  if (heraldHud_listToolDiv) {
    heraldHud_listToolDiv.innerHTML = listTools;

    document
      .querySelectorAll(".heraldHud-dialogToolItem")
      .forEach((toolItem) => {
        toolItem.addEventListener("click", async function () {
          let itemId = this.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);
          if (item) {
            await item.use();
          }
        });
      });

    document.querySelectorAll(".heraldHud-toolEquipButton").forEach((div) => {
      div.addEventListener("click", async (event) => {
        event.stopPropagation();
        let itemId = div.getAttribute("data-item-id");
        let item = actor.items.get(itemId);

        if (item) {
          let equipped = item.system.equipped;
          await item.update({ "system.equipped": !equipped });
          div.classList.toggle("equipped", !equipped);
        }
      });
    });

    document
      .querySelectorAll(".heraldHud-toolFavoriteButton")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          let itemId = button.getAttribute("data-item-id");
          let rawItemId = `.Item.${itemId}`;
          let isCurrentlyFavorite = favoritesActor.some(
            (fav) => fav.id === rawItemId
          );

          if (isCurrentlyFavorite) {
            favoritesActor = favoritesActor.filter(
              (fav) => fav.id !== rawItemId
            );
          } else {
            let maxSort =
              favoritesActor.length > 0
                ? Math.max(...favoritesActor.map((fav) => fav.sort))
                : 0;
            favoritesActor.push({
              type: "item",
              id: rawItemId,
              sort: maxSort + 100000,
            });
          }
          if (Array.isArray(favoritesActor)) {
            await actor.update({ "system.favorites": favoritesActor });
          }

          button.classList.toggle("favorited", !isCurrentlyFavorite);
        });
      });
  }
  let heraldHud_listConsumableDiv = document.getElementById(
    "heraldHud-dialogListConsumable"
  );
  let listConsumables = ``;
  let consumablesItem = actor.items.filter(
    (item) => item.type === "consumable"
  );

  consumablesItem.forEach((item) => {
    let htmlDescription = ``;
    if (item.system?.identified === false) {
      htmlDescription = item.system.unidentified.description;
    } else {
      htmlDescription = item.system.description.value;
    }

    let consumableItemUses = "";

    if (item.system.uses?.max) {
      consumableItemUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
    }
    let arrProperti = [];
    let labelProperti = "";

    if (item.labels.toHit) {
      arrProperti.push(`To hit ${item.labels.toHit}`);
    }
    if (item.labels.save) {
      arrProperti.push(item.labels.save);
    }
    if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
      if (item.labels.damages) {
        for (let damage of item.labels.damages) {
          let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
          arrProperti.push(`${damage.formula} ${damageIcon}`);
        }
      }
    } else {
      if (item.labels.damage) {
        for (let damage of item.labels.derivedDamage) {
          let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

          arrProperti.push(`${damage.formula} ${damageIcon}`);
        }
      }
    }
    if (arrProperti.length > 0) {
      labelProperti = arrProperti.join(" | ");
    }
    listConsumables += `
    <div id="heraldHud-dialogConsumableContainer" class="heraldHud-dialogConsumableContainer">
      <div id="heraldHud-dialogConsumableItem" class="heraldHud-dialogConsumableItem" data-item-id="${item.id}">
          <div id="heraldHud-consumableLeft" class="heraldHud-consumableLeft">
            <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogConsumableImage">
          </div>
          <div id="heraldHud-consumableMiddle" class="heraldHud-consumableMiddle">
            <div id="heraldHud-consumableName" class="heraldHud-consumableName">${item.name}</div>
            <div id="heraldHud-consumableCategory-${item.id}" class="heraldHud-consumableCategory" >
               <div class="heraldHud-consumableType">${item.system.type.label}</div>
                <div id="heraldHud-consumableUsesValue-${item.id}" class="heraldHud-consumableUsesValue">${consumableItemUses}</div>
            </div>
            <div id class="heraldHud-consumableProperti">${labelProperti}</div>
          </div>
          <div id="heraldHud-consumableRight" class="heraldHud-consumableRight">
            <div id="heraldHud-consumableQty-${item.id}">
                x${item.system.quantity}
            </div>
          </div>
      </div>

      <div id="heraldHud-dialogConsumableTooltip" class="heraldHud-dialogConsumableTooltip">
        <div class="heraldHud-consumableTooltipTop">
        ${item.name}  
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        </div>
        <div class="heraldHud-consumableTooltipMiddle">
        ${htmlDescription}
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        </div>
        <div class="heraldHud-consumableTooltipBottom"></div>
      </div>
    </div>
    `;
  });

  if (heraldHud_listConsumableDiv) {
    heraldHud_listConsumableDiv.innerHTML = listConsumables;

    document
      .querySelectorAll(".heraldHud-dialogConsumableItem")
      .forEach((toolItem) => {
        toolItem.addEventListener("click", async function () {
          let itemId = this.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);

          if (item) {
            await item.use();
            let updatedItem =
              actor.items.get(itemId) ||
              actor.getEmbeddedDocument("Item", itemId);
            if (updatedItem) {
              let qtyConsumableDiv = document.getElementById(
                `heraldHud-consumableQty-${item.id}`
              );

              if (qtyConsumableDiv) {
                qtyConsumableDiv.innerText = `x${updatedItem.system.quantity}`;
              }
              let consumableUsesDiv = document.getElementById(
                `heraldHud-consumableUsesValue-${item.id}`
              );
              let consumableItemUses = "";

              if (updatedItem.system.uses?.max) {
                consumableItemUses = `${updatedItem.system.uses.value}/${updatedItem.system.uses.max}`;
              }
              if (consumableUsesDiv) {
                consumableUsesDiv.innerText = `| ${consumableItemUses}`;
              }
            }
          }
        });
      });
  }
}
async function heraldHud_inventoryGetDataWeapon() {}
async function heraldHud_inventoryGetDataTool() {}
async function heraldHud_inventoryGetDataConsumable() {}

async function heraldHud_renderItemLoots() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogItemLoots" class="heraldHud-dialogItemLoots">
      <div id="heraldHud-dialogLootsContainer" class="heraldHud-dialogLootsContainer">
        <div id="heraldHud-dialogLootsTitle" class="heraldHud-dialogLootsTitle">Loots</div>
        <hr style=" border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListLoots" class="heraldHud-dialogListLoots">
        </div>
      </div>
      <div id="heraldHud-dialogCurrencyContainer" class="heraldHud-dialogCurrencyContainer">
      </div>
    </div>
    `;
    await heraldHud_getDataLoots();
  }
}
async function heraldHud_getDataLoots() {
  let actor = heraldHud_actorSelected;
  let heraldHudListLootsDiv = document.getElementById(
    "heraldHud-dialogListLoots"
  );
  let heraldHudCurrencyDiv = document.getElementById(
    "heraldHud-dialogCurrencyContainer"
  );
  let lootsItem = actor.items.filter((item) => item.type === "loot");

  let listLoots = ``;

  lootsItem.forEach((item) => {
    let lootsItemUses = "";
    let priceLabel = ``;

    if (item.system.price?.denomination) {
      let icons = {
        pp: { name: "Platinum", file: "platinum" },
        gp: { name: "Gold", file: "gold" },
        ep: { name: "Electrum", file: "electrum" },
        sp: { name: "Silver", file: "silver" },
        cp: { name: "Copper", file: "copper" },
      };

      let currency = icons[item.system.price.denomination] || icons["gp"];

      let currencyIcon = `
        <div class="heraldHud-valueCurrencyContainer">
          <img src="/systems/dnd5e/icons/currency/${currency.file}.webp" 
               alt="${currency.name}" 
               style="width: 12px; height: 12px; vertical-align: middle; border:none;">
          <div class="heraldHud-valueCurrencyTooltip">${currency.name}</div>
        </div>`;

      priceLabel = `| ${currencyIcon} ${item.system.price.value} `;
    }

    if (item.system.uses?.max) {
      lootsItemUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
    }

    listLoots += `
      <div id="heraldHud-dialogLootsContainer" class="heraldHud-dialogLootsContainer">
        <div id="heraldHud-dialogLootsItem" class="heraldHud-dialogLootsItem" data-item-id="${item.id}">
          <div id="heraldHud-lootsLeft" class="heraldHud-lootsLeft">
            <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogLootsImage">
          </div>
          <div id="heraldHud-lootsMiddle" class="heraldHud-lootsMiddle">
            <div id="heraldHud-lootsName" class="heraldHud-lootsName">${item.name}</div>
            <div id="heraldHud-lootsCategory" class="heraldHud-lootsCategory" >
              <div id="heraldHud-lootsType" class="heraldHud-lootsType">
                ${item.system.type.label}
              </div>
              <div id="heraldHud-lootsValue-${item.id}" class="heraldHud-lootsValue" >
                ${priceLabel}
              </div>
              <div id="heraldHud-lootsCharge-${item.id}" class="heraldHud-lootsCharge" >
                ${lootsItemUses}
              </div>
            </div>
          </div>
          <div id="heraldHud-lootsRight" class="heraldHud-lootsRight">
            <div id="heraldHud-lootsQty-${item.id}">
                x${item.system.quantity}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  if (heraldHudListLootsDiv) {
    heraldHudListLootsDiv.innerHTML = listLoots;
  }

  if (heraldHudCurrencyDiv) {
    const currencyTypes = ["pp", "gp", "ep", "sp", "cp"];
    const currencyNames = {
      pp: "Platinum Piece",
      gp: "Gold Piece",
      ep: "Electrum Piece",
      sp: "Silver Piece",
      cp: "Copper Piece",
    };

    let currencyHTML = `<div class="heraldHud-currencyContainer">`;

    for (let currency of currencyTypes) {
      let icon = heraldHud_getCurrencyIcon(currency);
      let value = actor.system.currency[currency] || 0;
      let name = currencyNames[currency];

      currencyHTML += `
        <div class="heraldHud-${currency}Container">
          <div class="heraldHud-iconCurrency">
            ${icon}
          </div>
          <input type="number" id="heraldHud-currency-${currency}" value="${value}" min="0">
        </div>
      `;
    }

    currencyHTML += `</div>`;

    heraldHudCurrencyDiv.innerHTML = currencyHTML;
  }

  document
    .querySelectorAll(".heraldHud-dialogLootsItem")
    .forEach((toolItem) => {
      let itemId = toolItem.getAttribute("data-item-id");
      let item =
        actor.items.get(itemId) || actor.getEmbeddedDocument("Item", itemId);

      toolItem.addEventListener("click", async function () {
        if (item) {
          await item.use();
        }
      });
    });

  ["gp", "pp", "ep", "sp", "cp"].forEach((type) => {
    const input = document.getElementById(`heraldHud-currency-${type}`);

    if (input) {
      let timeout;

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          clearTimeout(timeout);

          timeout = setTimeout(() => {
            let value = parseInt(event.target.value);
            value = isNaN(value) || value < 0 ? 0 : value;
            actor.update({ [`system.currency.${type}`]: value });
          }, 500);
        }
      });
    }
  });
}

async function heraldHud_renderItemFeatures() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogItemFeatures" class="heraldHud-dialogItemFeatures">
      <div id="heraldHud-dialogFeaturesActiveContainer" class="heraldHud-dialogFeaturesActiveContainer">
        <div id="heraldHud-dialogFeaturesActiveTittle" class="heraldHud-dialogFeaturesActiveTittle">Active</div>
        <hr style=" width:100%;, border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListFeaturesActive" class="heraldHud-dialogListFeaturesActive">
      
        </div>
      </div>
      <div id="heraldHud-dialogFeaturesPassiveContainer" class="heraldHud-dialogFeaturesPassiveContainer">
        <div id="heraldHud-dialogFeaturesPassiveTittle" class="heraldHud-dialogFeaturesPassiveTittle">Passive</div>
         <hr style=" width:100%;, border: 1px solid grey; margin-top: 5px;">
        <div id="heraldHud-dialogListFeaturesPassive" class="heraldHud-dialogListFeaturesPassive">
      
        </div>
      </div>
    </div>`;
  }
  await heraldHud_getDataFeatures();
}
async function heraldHud_getDataFeatures() {
  let actor = heraldHud_actorSelected;

  let featuresActiveDiv = document.getElementById(
    "heraldHud-dialogListFeaturesActive"
  );
  let featuresPassiveDiv = document.getElementById(
    "heraldHud-dialogListFeaturesPassive"
  );
  let featuresItem = actor.items.filter((item) => item.type === "feat");

  let listFeaturesActive = ``;
  let listFeaturesPassive = ``;
  let favoritesActor = actor.system?.favorites || [];
  featuresItem.forEach((item) => {
    let htmlDescription = item.system.description.value;
    let rawItemId = `.Item.${item.id}`;
    let isFavorited = favoritesActor.some(
      (favorite) => favorite.id === rawItemId
    )
      ? "favorited"
      : "";
    if (item.system.activation?.type) {
      let category = ``;
      if (item.system.activation.type == "action") {
        category = `<i class="fa-solid fa-circle" style="color:#1f6237;"></i> Action`;
      } else if (item.system.activation.type.includes("bonus")) {
        category = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i> Bonus Action`;
      } else if (item.system.activation.type.includes("reaction")) {
        category = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i> Reaction`;
      } else if (item.system.activation.type.includes("legendary")) {
        category = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i> Legendary Action`;
      } else if (item.system.activation.type.includes("lair")) {
        category = `<i class="fa-solid fa-chess-rook" style="color:#c7cad6;"></i> Lair Action`;
      } else if (item.system.activation.type.includes("mythic")) {
        category = `<i class="fa-solid fa-spaghetti-monster-flying" style="color:#adffeb;"></i> Mythic Action`;
      } else if (item.system.activation.type.includes("minute")) {
        category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Minute`;
      } else if (item.system.activation.type.includes("hour")) {
        category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Hour`;
      } else if (item.system.activation.type.includes("day")) {
        category = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Day`;
      } else if (item.system.activation.type.includes("special")) {
        category = `<i class="fa-solid fa-sparkles" style="color:#d0f4fc;"></i> Special`;
      }
      let arrFeaturesCategory = [];
      if (category) {
        arrFeaturesCategory.push(category);
      }
      let featuresItemUses = "";

      if (item.system.uses?.max) {
        featuresItemUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
      }

      if (featuresItemUses) {
        arrFeaturesCategory.push(featuresItemUses);
      }
      let arrProperti = [];
      let labelProperti = "";

      if (item.labels.toHit) {
        arrProperti.push(`To hit ${item.labels.toHit}`);
      }
      if (item.labels.save) {
        arrProperti.push(item.labels.save);
      }
      if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
        if (item.labels.damages) {
          for (let damage of item.labels.damages) {
            let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
            arrProperti.push(`${damage.formula} ${damageIcon}`);
          }
        }
      } else {
        if (item.labels.damage) {
          for (let damage of item.labels.derivedDamage) {
            let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

            arrProperti.push(`${damage.formula} ${damageIcon}`);
          }
        }
      }
      if (arrProperti.length > 0) {
        labelProperti = arrProperti.join(" | ");
      }

      listFeaturesActive += `
        <div id="heraldHud-dialogFeaturesContainer" class="heraldHud-dialogFeaturesContainer">
          <div id="heraldHud-dialogFeaturesItem" class="heraldHud-dialogFeaturesItem" data-item-id="${item.id}">
            <div id="heraldHud-dialogFeaturesLeft" class="heraldHud-dialogFeaturesLeft">
              <div class="heraldHud-dialogFeaturesImageContainer">
                <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogFeaturesImage">
              </div>
              <div class="heraldHud-featuresFavoriteButton ${isFavorited}" data-item-id="${item.id}">
                  <i class="fa-solid fa-star"></i>
              </div>
            </div>
            <div id="heraldHud-dialogFeaturesMiddle" class="heraldHud-dialogFeaturesMiddle">
              <div id="heraldHud-dialogFeaturesName" class="heraldHud-dialogFeaturesName">${item.name}</div>
              <div id="heraldHud-dialogFeaturesCategory" class="heraldHud-dialogFeaturesCategory">
                <div class="heraldHud-featuresActiveType">${category} </div>
                <div id="heraldHud-featuresUsesValue-${item.id}" class="heraldHud-featuresUsesValue">${featuresItemUses}</div>
              </div>
              <div id="heraldHud-dialogFeaturesProperti" class="heraldHud-dialogFeaturesProperti">
              ${labelProperti}
              </div>
            </div>
            <div id="heraldHud-dialogFeaturesRight" class="heraldHud-dialogFeaturesRight">
             
            </div>
          </div>
          <div id="heraldHud-dialogFeaturesTooltip" class="heraldHud-dialogFeaturesTooltip">
            <div class="heraldHud-featuresTooltipTop">${item.name}  
            <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
            <div class="heraldHud-weaponTooltipMiddle">${htmlDescription} 
            <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
            <div class="heraldHud-featuresTooltipBottom"></div>
          </div>
        </div>
      `;
    } else {
      listFeaturesPassive += `
        <div id="heraldHud-dialogFeaturesContainer" class="heraldHud-dialogFeaturesContainer">
          <div id="heraldHud-dialogFeaturesItem" class="heraldHud-dialogFeaturesItem"  data-item-id="${item.id}">
            <div id="heraldHud-dialogFeaturesLeft" class="heraldHud-dialogFeaturesLeft">
              <div class="heraldHud-dialogFeaturesImageContainer">
                <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogFeaturesImage">
              </div>
            </div>
            <div id="heraldHud-dialogFeaturesMiddle" class="heraldHud-dialogFeaturesMiddle">
             <div id="heraldHud-dialogFeaturesName" class="heraldHud-dialogFeaturesName">${item.name}</div>
             <div id="heraldHud-dialogFeaturesCategory" class="heraldHud-dialogFeaturesCategory">${item.labels.featType}</div>
            </div>
            <div id="heraldHud-dialogFeaturesRight" class="heraldHud-dialogFeaturesRight">
            </div>
          </div>
          <div id="heraldHud-dialogFeaturesTooltip" class="heraldHud-dialogFeaturesTooltip">
            <div class="heraldHud-featuresTooltipTop">${item.name}  
            <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
            <div class="heraldHud-weaponTooltipMiddle">${htmlDescription} 
            <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
            <div class="heraldHud-featuresTooltipBottom"></div>
          </div>
        </div>
      `;
    }
  });

  if (featuresActiveDiv) {
    featuresActiveDiv.innerHTML = listFeaturesActive;

    document
      .querySelectorAll(".heraldHud-dialogFeaturesItem")
      .forEach((toolItem) => {
        toolItem.addEventListener("click", async function () {
          let itemId = this.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);

          if (item) {
            await item.use();
            let updatedItem =
              actor.items.get(itemId) ||
              actor.getEmbeddedDocument("Item", itemId);
            let featuresUsesDiv = document.getElementById(
              `heraldHud-featuresUsesValue-${item.id}`
            );
            let featureUses = ``;

            if (updatedItem.system.uses.max) {
              featureUses = `${updatedItem.system.uses.value}/${updatedItem.system.uses.max}`;
            }

            if (featuresUsesDiv) {
              featuresUsesDiv.innerText = `| ${featureUses}`;
            }
          }
        });
      });

    document
      .querySelectorAll(".heraldHud-featuresFavoriteButton")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          let itemId = button.getAttribute("data-item-id");
          let rawItemId = `.Item.${itemId}`;
          let isCurrentlyFavorite = favoritesActor.some(
            (fav) => fav.id === rawItemId
          );

          if (isCurrentlyFavorite) {
            favoritesActor = favoritesActor.filter(
              (fav) => fav.id !== rawItemId
            );
          } else {
            let maxSort =
              favoritesActor.length > 0
                ? Math.max(...favoritesActor.map((fav) => fav.sort))
                : 0;
            favoritesActor.push({
              type: "item",
              id: rawItemId,
              sort: maxSort + 100000,
            });
          }
          if (Array.isArray(favoritesActor)) {
            await actor.update({ "system.favorites": favoritesActor });
          }

          button.classList.toggle("favorited", !isCurrentlyFavorite);
        });
      });
  }

  if (featuresPassiveDiv) {
    featuresPassiveDiv.innerHTML = listFeaturesPassive;
  }
}

async function heraldHud_renderContainerSpells() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogSpellsContainer" class="heraldHud-dialogSpellsContainer">
      <div id="heraldHud-spellsListContainer" class="heraldHud-spellsListContainer">
        <div id="heraldHud-spellsTitle" class="heraldHud-spellsTitle"></div>
        <div id="heraldHud-spellsListItem" class="heraldHud-spellsListItem">
      
        </div>
      </div>
    </div>`;
  }
  await heraldHud_getDataSpellsList();

  if (!heraldHud_spellsTrackerOff) {
    if (heraldHud_dialog2Div) {
      heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogSpellsSlotContainer" class="heraldHud-dialogSpellsSlotContainer">
        <div id="heraldHud-spellsSlotLeftContainer" class="heraldHud-spellsSlotLeftContainer">
          <div id="heraldHud-spellSlotIcon" class="heraldHud-spellSlotIcon">
        
          </div>
          <div id="heraldHud-spellsPactMagicContainer" class="heraldHud-spellsPactMagicContainer">
        
          </div>
        </div>
        <div id="heraldHud-spellsSlotRightContainer" class="heraldHud-spellsSlotRightContainer">
        
        </div>
      </div>
      `;
    }
    await heraldHud_getDataSpellsSlot();
  }
}

async function heraldHud_getDataSpellsList() {
  let actor = heraldHud_actorSelected;
  let pactLevel = actor.system?.spells?.pact?.level || "";

  if (pactLevel > 0) {
    let suffix = "th";
    if (pactLevel === 1) suffix = "st";
    else if (pactLevel === 2) suffix = "nd";
    else if (pactLevel === 3) suffix = "rd";

    pactLevel = `(${pactLevel}${suffix})`;
  }
  let spellListDiv = document.getElementById("heraldHud-spellsListItem");
  const spellsData = actor.items.filter((item) => item.type === "spell");
  let favoritesActor = actor.system?.favorites || [];
  let listSpells = ``;

  let spellCategories = {
    atWill: { title: "At Will", spells: [] },
    innate: { title: "Innate Spellcasting", spells: [] },
    cantrip: { title: "Cantrips", spells: [] },
    pact: { title: `Pact Magic ${pactLevel}`, spells: [] },
    ritual: { title: "Ritual", spells: [] },
    1: { title: "1st Level Spells", spells: [] },
    2: { title: "2nd Level Spells", spells: [] },
    3: { title: "3rd Level Spells", spells: [] },
    4: { title: "4th Level Spells", spells: [] },
    5: { title: "5th Level Spells", spells: [] },
    6: { title: "6th Level Spells", spells: [] },
    7: { title: "7th Level Spells", spells: [] },
    8: { title: "8th Level Spells", spells: [] },
    9: { title: "9th Level Spells", spells: [] },
  };

  spellsData.forEach((item) => {
    let level = item.system.level || 0;
    let prepMode = item.system.preparation.mode;

    let isPrepared = item.system.preparation.prepared;

    if (prepMode === "atwill") {
      spellCategories.atWill.spells.push(item);
    } else if (prepMode === "innate") {
      spellCategories.innate.spells.push(item);
    } else if (level === 0) {
      spellCategories.cantrip.spells.push(item);
    } else if (prepMode === "pact") {
      spellCategories.pact.spells.push(item);
    } else if (prepMode.includes("ritual")) {
      spellCategories.ritual.spells.push(item);
    } else if (spellCategories.hasOwnProperty(level)) {
      if (prepMode !== "prepared" || isPrepared) {
        spellCategories[level].spells.push(item);
      }
    }
  });
  [
    "atWill",
    "innate",
    "cantrip",
    "pact",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "ritual",
  ].forEach((key) => {
    let { title, spells } = spellCategories[key];
    if (spells.length > 0) {
      let spellSlotDisplay = ``;
      if (key >= 1 && key <= 9) {
        let slotValue = actor.system?.spells?.[`spell${key}`]?.value || 0;
        let slotMax = actor.system?.spells?.[`spell${key}`]?.max || 0;
        spellSlotDisplay = `(${slotValue}/${slotMax})`;
      }

      listSpells += `
      <div class="heraldHud-spellCategoryDiv">
        <div class="heraldHud-spellLevelTitle">${title}</div>
        <div class="heraldHud-spellLevelSlot" data-level="${key}">${spellSlotDisplay}</div>
      </div>`;
      spells.forEach((item) => {
        let rawItemId = `.Item.${item.id}`;
        let isFavorited = favoritesActor.some(
          (favorite) => favorite.id === rawItemId
        )
          ? "favorited"
          : "";

        let arrProperti = [];
        let labelProperti = "";

        if (item.labels.toHit) {
          arrProperti.push(`To hit ${item.labels.toHit}`);
        }
        if (item.labels.save) {
          arrProperti.push(item.labels.save);
        }
        if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
          if (item.labels.damages) {
            for (let damage of item.labels.damages) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        } else {
          if (item.labels.damage) {
            for (let damage of item.labels.derivedDamage) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        }
        if (arrProperti.length > 0) {
          labelProperti = arrProperti.join(" | ");
        }

        let activeType = ``;
        if (item.system.activation.type == "action") {
          activeType = `<i class="fa-solid fa-circle" style="color:#1f6237;"></i> Action`;
        } else if (item.system.activation.type.includes("bonus")) {
          activeType = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i> Bonus Action`;
        } else if (item.system.activation.type.includes("reaction")) {
          activeType = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i> Reaction`;
        } else if (item.system.activation.type.includes("legendary")) {
          activeType = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i> Legendary Action`;
        } else if (item.system.activation.type.includes("lair")) {
          activeType = `<i class="fa-solid fa-chess-rook" style="color:#c7cad6;"></i> Lair Action`;
        } else if (item.system.activation.type.includes("mythic")) {
          activeType = `<i class="fa-solid fa-spaghetti-monster-flying" style="color:#adffeb;"></i> Mythic Action`;
        } else if (item.system.activation.type.includes("minute")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Minute`;
        } else if (item.system.activation.type.includes("hour")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Hour`;
        } else if (item.system.activation.type.includes("day")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Day`;
        } else if (item.system.activation.type.includes("special")) {
          activeType = `<i class="fa-solid fa-sparkles" style="color:#d0f4fc;"></i> Special`;
        }

        let spellsUses = "";
        if (item.system.uses?.max) {
          spellsUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
        }
        let spellsSchool = heraldHud_getSpellsSchoolIcon(item.system.school);

        let spellComponent = heraldHud_getSpellIcons(item);

        let spellsRange = item.system.range?.units
          ? `| ${item.system.range.value || ""} ${
              item.system.range.units === "ft"
                ? "ft"
                : item.system.range.units.charAt(0).toUpperCase() +
                  item.system.range.units.slice(1)
            }`.trim()
          : "";

        let target = item.system.target?.value
          ? `(${item.system.target.value} ${
              item.system.target.type
                ? item.system.target.type.charAt(0).toUpperCase() +
                  item.system.target.type.slice(1)
                : ""
            })`
          : "";

        let displayRange = spellsRange ? `${spellsRange} ${target}`.trim() : "";

        let htmlDescription = item.system.description.value;
        listSpells += `
          <div class="heraldHud-spellsContainer">
            <div class="heraldHud-spellsItem" data-item-id="${item.id}">
                <div class="heraldHud-spellsLeftContainer">
                    <div class="heraldHud-spellsImageContainer">
                      <img src="${item.img}" alt="${item.name}" class="heraldHud-spellsImage">
                    </div>
                </div>
                <div class="heraldHud-spellsMiddleContainer">
                  <div class="heraldHud-spellsMiddleTop">
                    <div class="heraldHud-spellsName">${item.name}</div>
                    <div class="heraldHud-spellsComponent">${spellComponent}</div>
                  </div>
                  <div class="heraldHud-spellsMiddleMid">
                    <div class="heraldHud-spellsActiveType">${activeType}</div>
                    <div class="heraldHud-spellsUses">${spellsUses}</div>
                    <div class="heraldHud-spellsRange">${displayRange}</div>
                  </div>
                  <div class="heraldHud-spellsMiddleBot">
                    ${labelProperti}
                  </div>
                </div>
                <div class="heraldHud-spellsRightContainer">
                    <div class="heraldHud-spellFavoriteButton ${isFavorited}" data-item-id="${item.id}">
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <div class="heraldHud-spellsSchool">${spellsSchool}</div>
                </div>
            </div>
              <div id="heraldHud-dialogSpellsTooltip" class="heraldHud-dialogSpellsTooltip">
                <div class="heraldHud-spellsTooltipTop">
                ${item.name}  
                <hr style=" border: 1px solid grey; margin-top: 5px;">
                </div>
                <div class="heraldHud-spellsTooltipMiddle">
                ${htmlDescription}
                <hr style=" border: 1px solid grey; margin-top: 5px;">
                </div>
                <div class="heraldHud-spellsTooltipBottom"></div>
              </div>
          </div>
        `;
      });
    }
  });

  if (spellListDiv) {
    spellListDiv.innerHTML = listSpells;

    document.querySelectorAll(".heraldHud-spellsItem").forEach((spellItem) => {
      spellItem.addEventListener("click", async (event) => {
        event.stopPropagation();

        let spellId = spellItem.getAttribute("data-item-id");
        let spell =
          actor.items.get(spellId) ||
          actor.getEmbeddedDocument("Item", spellId);

        if (spell) {
          await spell.use();
        }
      });
    });

    document
      .querySelectorAll(".heraldHud-spellFavoriteButton")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          let itemId = button.getAttribute("data-item-id");
          let rawItemId = `.Item.${itemId}`;
          let isCurrentlyFavorite = favoritesActor.some(
            (fav) => fav.id === rawItemId
          );

          if (isCurrentlyFavorite) {
            favoritesActor = favoritesActor.filter(
              (fav) => fav.id !== rawItemId
            );
          } else {
            let maxSort =
              favoritesActor.length > 0
                ? Math.max(...favoritesActor.map((fav) => fav.sort))
                : 0;
            favoritesActor.push({
              type: "item",
              id: rawItemId,
              sort: maxSort + 100000,
            });
          }
          if (Array.isArray(favoritesActor)) {
            await actor.update({ "system.favorites": favoritesActor });
          }

          button.classList.toggle("favorited", !isCurrentlyFavorite);
        });
      });
  }
}

async function heraldHud_getDataSpellsSlot() {
  let actor = heraldHud_actorSelected;
  let pactLevel = actor.system?.spells?.pact?.level || "";

  if (pactLevel > 0) {
    let suffix = "th";
    if (pactLevel === 1) suffix = "st";
    else if (pactLevel === 2) suffix = "nd";
    else if (pactLevel === 3) suffix = "rd";

    pactLevel = `(${pactLevel}${suffix})`;
  }
  let spellsPactMagicContainer = document.getElementById(
    "heraldHud-spellsPactMagicContainer"
  );
  let spellsSlotRightDiv = document.getElementById(
    "heraldHud-spellsSlotRightContainer"
  );

  if (spellsPactMagicContainer) {
    let pactMagicValue = actor.system?.spells?.pact?.value || 0;
    let pactMagicMax = actor.system?.spells?.pact?.max || 0;

    let pactMagicDisplay = `${pactMagicValue}/${pactMagicMax}`;

    spellsPactMagicContainer.innerHTML = `
    <div class="heraldHud-slotPactMagicContainer">
      <div class="heraldHud-slotPactMagicTitle">Pact Magic ${pactLevel}</div>
        <div class="heraldHud-slotPactMagicItem">
          <div class="heraldHud-slotPactMagicTop"></div>
          <div class="heraldHud-slotPactMagicMiddle">
            <div class="heraldHud-slotPactMagicValue">${pactMagicDisplay}</div>
          </div>
          <div class="heraldHud-slotPactMagicBottom"></div>
        </div>
      </div>
    </div>
     
    `;
  }

  if (spellsSlotRightDiv) {
    let spellSlotsHTML = `<div class="heraldHud-spellSlotsGrid">`;

    for (let level = 1; level <= 9; level++) {
      let levelFormatted =
        level === 1
          ? "1st"
          : level === 2
          ? "2nd"
          : level === 3
          ? "3rd"
          : `${level}th`;

      let slotValue = actor.system?.spells?.[`spell${level}`]?.value || 0;
      let slotMax = actor.system?.spells?.[`spell${level}`]?.max || 0;
      let spellSlotDisplay = `(${slotValue}/${slotMax})`;
      let spellSlotElement = document.querySelector(
        `.heraldHud-spellLevelSlot[data-level="${level}"]`
      );
      if (spellSlotElement) {
        spellSlotElement.innerText = spellSlotDisplay;
      }
      spellSlotsHTML += `
        <div class="heraldHud-slotSpellContainer">
          <div class="heraldHud-slotSpellTitle">${levelFormatted}</div>
          <div class="heraldHud-slotSpellItem">
            <div class="heraldHud-slotSpellTop"></div>
            <div class="heraldHud-slotSpellMiddle">
              <div class="heraldHud-slotSpellValue">${spellSlotDisplay}</div>
            </div>
            <div class="heraldHud-slotSpellBottom"></div>
          </div>
        </div>
      `;
    }

    spellSlotsHTML += `</div>`;
    spellsSlotRightDiv.innerHTML = spellSlotsHTML;
  }
}

async function heraldHud_renderContainerStats() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogStatsContainer" class="heraldHud-dialogStatsContainer">
      <div id="heraldHud-statsAbilitiesContainer" class="heraldHud-statsAbilitiesContainer">
        <div id="heraldHud-statsAbilitiesTitle" class="heraldHud-statsAbilitiesTitle">Abilities</div>
        <div id="heraldHud-statsListAbilities" class="heraldHud-statsListAbilities">
      
        </div>
      </div>
      <div id="heraldHud-statsSkillsContainer" class="heraldHud-statsSkillsContainer">
        <div id="heraldHud-statsSkillsTitle" class="heraldHud-statsSkillsTitle">Skills</div>
        <div id="heraldHud-statsListSkills" class="heraldHud-statsListSkills">
      
        </div>
      </div>
    </div>`;
  }
  await heraldHud_getDataStats();
}
async function heraldHud_getDataStats() {
  let actor = heraldHud_actorSelected;
  let statsListAbilitiesDiv = document.getElementById(
    "heraldHud-statsListAbilities"
  );

  let abilitiesData = actor.system.abilities;

  let listAbilities = ``;

  const abilitiesNames = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma",
  };

  for (let [key, abilityData] of Object.entries(abilitiesData)) {
    let abilityMod =
      abilityData.mod >= 0 ? `+${abilityData.mod}` : abilityData.mod;
    listAbilities += `
    <div id="heraldHud-abilitiesContainer" class="heraldHud-abilitiesContainer">
      <div id="heraldHud-abilitiesItem" class="heraldHud-abilitiesItem" data-ability="${key}">
        <div id="heraldHud-abilitiesItemTop" class="heraldHud-abilitiesItemTop">
          <div id="heraldHud-abilitiesName" class="heraldHud-abilitiesName">  ${key.toUpperCase()}</div>
          <div id="heraldHud-abilitiesValue" class="heraldHud-abilitiesValue">&#9654; ${
            abilityData.value
          }</div>
        
        </div>
        <div id="heraldHud-abilitiesItemMiddle" class="heraldHud-abilitiesItemMiddle">
          ${abilityMod}
        </div>
        <div id="heraldHud-abilitiesItemBot" class="heraldHud-abilitiesItemBot">
          <div id="heraldHud-abilitiesSaveButton" class="heraldHud-abilitiesSaveButton">
            Save
          </div>
        </div>
      </div>
    </div>
    `;
  }

  if (statsListAbilitiesDiv) {
    statsListAbilitiesDiv.innerHTML = listAbilities;

    document
      .querySelectorAll(
        ".heraldHud-abilitiesItemTop, .heraldHud-abilitiesItemMiddle"
      )
      .forEach((element) => {
        element.addEventListener("click", (event) => {
          let ability = event.target
            .closest(".heraldHud-abilitiesItem")
            .getAttribute("data-ability");
          actor.rollAbilityTest(ability);
        });
      });

    document
      .querySelectorAll(".heraldHud-abilitiesSaveButton")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          let ability = event.target
            .closest(".heraldHud-abilitiesItem")
            .getAttribute("data-ability");
          actor.rollAbilitySave(ability);
        });
      });
  }

  await heraldHud_renderDataStatsSkill();
}

async function heraldHud_renderDataStatsSkill() {
  let actor = heraldHud_actorSelected;
  let skillsData = actor.system.skills;
  let listSkills = ``;
  let statsListSkillDiv = document.getElementById("heraldHud-statsListSkills");
  const skillsNames = {
    acr: "Acrobatics",
    ani: "Animal Handling",
    arc: "Arcana",
    ath: "Athletics",
    dec: "Deception",
    his: "History",
    ins: "Insight",
    itm: "Intimidation",
    inv: "Investigation",
    med: "Medicine",
    nat: "Nature",
    prc: "Perception",
    prf: "Performance",
    per: "Persuasion",
    rel: "Religion",
    slt: "Sleight of Hand",
    ste: "Stealth",
    sur: "Survival",
  };

  for (let [key, skillData] of Object.entries(skillsData)) {
    let nameSkill = skillsNames[key];
    let skillTotal =
      skillData.total >= 0 ? `+${skillData.total}` : skillData.total;
    let proficientData = ``;
    if (skillData.proficient == 1) {
      proficientData = `<i class="fa-solid fa-circle" style="color:#8f8f8f;"></i>`;
    } else {
      proficientData = `<i class="fa-regular fa-circle"  style="color:#8f8f8f;"></i>`;
    }

    let skillDivTop = `
    <div id="heraldHud-skillItemTop" class="heraldHud-skillItemTop">
      <div id="heraldHud-skillName" class="heraldHud-skillName">${nameSkill}</div>
        <div class="heraldHud-skillValueData">
          <div id="heraldHud-skillValueTotal" class="heraldHud-skillValueTotal">${skillTotal}</div>
          <div id="heraldHud-skillValuePassive" class="heraldHud-skillValuePassive">(${skillData.passive})</div>
          <div id="heraldHud-skillValueProficient" class="heraldHud-skillValueProficient">${proficientData}</div>
        </div>
    </div>
    
    `;

    if (heraldHud_statsAbbreviations) {
      let skillNameFormatted = key.charAt(0).toUpperCase() + key.slice(1);

      skillDivTop = `
      <div id="heraldHud-skillItemTop" class="heraldHud-skillItemTop">
        <div id="heraldHud-skillName" class="heraldHud-skillName">${skillNameFormatted}</div>
          <div class="heraldHud-skillValueData">
            <div id="heraldHud-skillValueTotal" class="heraldHud-skillValueTotal">${skillTotal}</div>
            <div id="heraldHud-skillValuePassive" class="heraldHud-skillValuePassive">(${skillData.passive})</div>
            <div id="heraldHud-skillValueProficient" class="heraldHud-skillValueProficient">${proficientData}</div>
          </div>
      </div>
      `;

      statsListSkillDiv.style.gridTemplateColumns = "repeat(4, 1fr)";
    }
    listSkills += `
    <div id="heraldHud-skillContainer" class="heraldHud-skillContainer">
      <div id="heraldHud-skillItem" class="heraldHud-skillItem" data-skill="${key}">
        ${skillDivTop}
        <div id="heraldHud-skillItemMiddle" class="heraldHud-skillItemMiddle">
        </div>
        <div id="heraldHud-skillItemBot" class="heraldHud-skillItemBot">
        </div>
      </div>
    </div>
    `;
  }

  if (statsListSkillDiv) {
    statsListSkillDiv.innerHTML = listSkills;

    document.querySelectorAll(".heraldHud-skillItem").forEach((element) => {
      element.addEventListener("click", (event) => {
        let skillKey = element.getAttribute("data-skill");
        if (!skillKey) return;

        actor.rollSkill(skillKey);
      });
    });
  }
}

async function heraldHud_renderContainerSpellsPrep() {
  let actor = heraldHud_actorSelected;
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");

  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
    <div id="heraldHud-dialogSpellsPrepContainer" class="heraldHud-dialogSpellsPrepContainer">
      <div id="heraldHud-spellsPrepContainerDiv" class="heraldHud-spellsPrepContainerDiv">
        <div id="heraldHud-spellsPrepTitle" class="heraldHud-spellsPrepTitle">Spells Preparation</div>
        <div class="heraldHud-spellsPrepSearchContainer">
          <input type="text" id="heraldHud-spellsPrepSearch" class="heraldHud-spellsPrepSearch" 
        placeholder="Search Spells...">
        </div>
      
        <div id="heraldHud-spellsPrepList" class="heraldHud-spellsPrepList">
      
        </div>
      </div>
    </div>`;

    let searchInput = document.getElementById("heraldHud-spellsPrepSearch");
    let spellSearchTimeout;

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(spellSearchTimeout);

        spellSearchTimeout = setTimeout(() => {
          heraldHud_getDataSpellsPrep();
        }, 1000);
      });
    }
  }
  await heraldHud_getDataSpellsPrep();
}

async function heraldHud_getDataSpellsPrep() {
  let actor = heraldHud_actorSelected;
  let searchInput = document.getElementById("heraldHud-spellsPrepSearch");
  let filterSpells = ``;
  if (searchInput.value) {
    filterSpells = searchInput.value;
  }
  let spellsPrepListDiv = document.getElementById("heraldHud-spellsPrepList");
  let spellsData = actor.items.filter(
    (item) =>
      item.type === "spell" &&
      item.system.preparation.mode === "prepared" &&
      item.system.level > 0
  );
  let listSpellsPrep = ``;

  let spellCategories = {
    1: { title: "1st Level Spells", spells: [] },
    2: { title: "2nd Level Spells", spells: [] },
    3: { title: "3rd Level Spells", spells: [] },
    4: { title: "4th Level Spells", spells: [] },
    5: { title: "5th Level Spells", spells: [] },
    6: { title: "6th Level Spells", spells: [] },
    7: { title: "7th Level Spells", spells: [] },
    8: { title: "8th Level Spells", spells: [] },
    9: { title: "9th Level Spells", spells: [] },
  };
  spellsData.sort((a, b) => a.name.localeCompare(b.name));
  if (filterSpells.trim() !== "") {
    spellsData = spellsData.filter((spell) =>
      spell.name.toLowerCase().includes(filterSpells.toLowerCase())
    );
  }
  spellsData.forEach((item) => {
    let spellLevel = item.system.level;
    if (spellCategories[spellLevel]) {
      spellCategories[spellLevel].spells.push(item);
    }
  });

  Object.values(spellCategories).forEach((category) => {
    if (category.spells.length > 0) {
      let listSpells = ``;
      category.spells.forEach((item) => {
        let isPrepared =
          item.system.preparation.prepared == true ? "prepared" : "";

        let arrProperti = [];
        let labelProperti = "";

        if (item.labels.toHit) {
          arrProperti.push(`To hit ${item.labels.toHit}`);
        }
        if (item.labels.save) {
          arrProperti.push(item.labels.save);
        }
        if (foundry.utils.isNewerVersion(heraldHud_gameVersion, "3.3.1")) {
          if (item.labels.damages) {
            for (let damage of item.labels.damages) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);
              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        } else {
          if (item.labels.damage) {
            for (let damage of item.labels.derivedDamage) {
              let damageIcon = heraldHud_getGameIconDamage(damage.damageType);

              arrProperti.push(`${damage.formula} ${damageIcon}`);
            }
          }
        }
        if (arrProperti.length > 0) {
          labelProperti = arrProperti.join(" | ");
        }

        let activeType = ``;
        if (item.system.activation.type == "action") {
          activeType = `<i class="fa-solid fa-circle" style="color:#1f6237;"></i> Action`;
        } else if (item.system.activation.type.includes("bonus")) {
          activeType = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i> Bonus Action`;
        } else if (item.system.activation.type.includes("reaction")) {
          activeType = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i> Reaction`;
        } else if (item.system.activation.type.includes("legendary")) {
          activeType = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i> Legendary Action`;
        } else if (item.system.activation.type.includes("lair")) {
          activeType = `<i class="fa-solid fa-chess-rook" style="color:#c7cad6;"></i> Lair Action`;
        } else if (item.system.activation.type.includes("mythic")) {
          activeType = `<i class="fa-solid fa-spaghetti-monster-flying" style="color:#adffeb;"></i> Mythic Action`;
        } else if (item.system.activation.type.includes("minute")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Minute`;
        } else if (item.system.activation.type.includes("hour")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Hour`;
        } else if (item.system.activation.type.includes("day")) {
          activeType = `<i class="fa-solid fa-hourglass-start" style="color:#0ad1c4;"></i> ${item.system.activation.cost} Day`;
        } else if (item.system.activation.type.includes("special")) {
          activeType = `<i class="fa-solid fa-sparkles" style="color:#d0f4fc;"></i> Special`;
        }

        let spellsUses = "";
        if (item.system.uses?.max) {
          spellsUses = `| ${item.system.uses.value}/${item.system.uses.max}`;
        }
        let spellsSchool = heraldHud_getSpellsPrepSchoolIcon(
          item.system.school
        );

        let spellComponent = heraldHud_getSpellIcons(item);

        let spellsRange = item.system.range?.units
          ? `| ${item.system.range.value || ""} ${
              item.system.range.units === "ft"
                ? "ft"
                : item.system.range.units.charAt(0).toUpperCase() +
                  item.system.range.units.slice(1)
            }`.trim()
          : "";
        listSpells += `
          <div id="heraldHud-spellsPrepContainer" class="heraldHud-spellsPrepContainer">
            <div id="heraldHud-spellsPrepItem" class="heraldHud-spellsPrepItem" data-item-id="${item.id}">
              <div id="heraldHud-spellsPrepLeft" class="heraldHud-spellsPrepLeft">
                <div class="heraldHud-dialogFeaturesImageContainer">
                  <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogFeaturesImage">
                </div>
             
                <div class="heraldHud-spellsPrepUnderImage">
                  <div class="heraldHud-spellsPrepButton ${isPrepared}" data-item-id="${item.id}">
                    <i class="fa-solid fa-sun"></i>
                  </div>
                   <div class="heraldHud-spellsPrepSchool">${spellsSchool}</div>
                </div>
              
              </div>
              <div id="heraldHud-spellsPrepMiddle" class="heraldHud-spellsPrepMiddle">
                  <div class="heraldHud-spellsPrepMiddleTop">
                    <div class="heraldHud-spellsPrepName">${item.name} </div>
                    <div class="heraldHud-spellsPrepComponent">${spellComponent}</div>
                  </div>
                  <div class="heraldHud-spellsPrepMiddleMid">
                    <div class="heraldHud-spellsPrepActiveType">${activeType}</div>
                    <div class="heraldHud-spellsPrepUses">${spellsUses}</div>
                    <div class="heraldHud-spellsPrepRange">${spellsRange}</div>
                  </div>
                  <div class="heraldHud-spellsPrepMiddleBot">
                    ${labelProperti}
                  </div>
              </div>
              <div id="heraldHud-spellsPrepRight" class="heraldHud-spellsPrepRight"></div>
            </div>
          </div>
        `;
      });

      listSpellsPrep += `
      <div class="heraldHud-spellsCategory">
        <div class="heraldHud-spellsCategoryTitle">${category.title}</div>
        <hr style=" border: 1px solid grey; margin-top: 5px;"></div>
        <div class="heraldHud-spellsCategoryList">
        ${listSpells}
        </div>
      </div>
    `;
    }
  });

  if (spellsPrepListDiv) {
    spellsPrepListDiv.innerHTML = listSpellsPrep;

    document.querySelectorAll(".heraldHud-spellsPrepButton").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        let spellId = btn.getAttribute("data-item-id");

        let spell =
          actor.items.get(spellId) ||
          actor.getEmbeddedDocument("Item", spellId);

        if (spell) {
          let newPreparedStatus =
            !spell.system.preparation.prepared ||
            spell.system.preparation.prepared === null;

          await spell.update({
            "system.preparation.prepared": newPreparedStatus,
          });
          btn.classList.toggle("prepared", newPreparedStatus);
        }
      });
    });
  }
}

async function heraldHud_openSettingHudDialog() {
  let dialogContent = `
    <div style="display: flex; flex-direction: column; gap: 10px;">

      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" id="heraldHud-statsAbbreviationsToggle" ${
          heraldHud_statsAbbreviations ? "checked" : ""
        }>
        <label for="heraldHud-statsAbbreviationsToggle">Abbreviations Skill</label>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" id="heraldHud-spellsTrackerToggle" ${
          heraldHud_spellsTrackerOff ? "checked" : ""
        }>
        <label for="heraldHud-spellsTrackerToggle">Disable Spell Slot Tracker Box</label>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" id="heraldHud-displayChargeTrackerToggle" ${
          heraldHud_displayChargeTracker ? "checked" : ""
        }>
        <label for="heraldHud-displayChargeTrackerToggle">Display Charge Tracker</label>
      </div>
      
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" id="heraldHud-dockHudToggle" ${
          heraldHud_dockHudToBottom ? "checked" : ""
        }>
        <label for="heraldHud-dockHudToggle">Dock Herald's HUD to Bottom</label>
      </div>
    </div>
  `;

  new Dialog({
    title: "Herald HUD Settings",
    content: dialogContent,
    buttons: {
      save: {
        label: "Save",
        callback: (html) => {
          let spellTrackerCheckbox = html.find(
            "#heraldHud-spellsTrackerToggle"
          )[0];
          let dockHudCheckbox = html.find("#heraldHud-dockHudToggle")[0];
          let statsAbbreviationsCheckbox = html.find(
            "#heraldHud-statsAbbreviationsToggle"
          )[0];
          let displayChargeTrackerCheckbox = html.find(
            "#heraldHud-displayChargeTrackerToggle"
          )[0];

          heraldHud_spellsTrackerOff = spellTrackerCheckbox.checked;
          heraldHud_dockHudToBottom = dockHudCheckbox.checked;
          heraldHud_statsAbbreviations = statsAbbreviationsCheckbox.checked;
          heraldHud_displayChargeTracker = displayChargeTrackerCheckbox.checked;

          heraldHud_settingHudToBottom();
          heraldHud_renderChargeTracker();
        },
      },
      cancel: {
        label: "Refresh",
        callback: async () => {
          await heraldHud_renderHeraldHud();
        },
      },
    },
    default: "save",
  }).render(true);
}

async function heraldHud_settingHudToBottom() {
  let heraldHud = document.getElementById("heraldHud");
  let dialog = document.getElementById("heraldHud-dialog");
  let dialog2 = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dockHudToBottom) {
    if (heraldHud) {
      heraldHud.style.bottom = 0;
    }
    dialog.style.bottom = "6%";
    if (dialog) {
    }
    dialog2.style.bottom = "6%";
    if (dialog2) {
    }
  } else {
    if (heraldHud) {
      heraldHud.style.bottom = `8%`;
    }
    if (dialog) {
      dialog.style.bottom = `14%`;
    }
    if (dialog2) {
      dialog2.style.bottom = `14%`;
    }
  }
}
async function heraldHud_renderChargeTracker() {
  if (heraldHud_displayChargeTracker == false) {
    return;
  }
  let actor = heraldHud_actorSelected;
  let favoritesActor = actor.system?.favorites;
  let chargeTrackerDiv = document.getElementById(
    "heraldHud-chargeTrackerContainer"
  );
  let chargeItems = actor.items.filter((item) =>
    heraldHud_listChargeTracker.some((trackerName) => trackerName === item.name)
  );
  let favoriteItems = chargeItems.filter((item) =>
    favoritesActor.some((fav) => fav.id.includes(item.id))
  );
  let nonFavoriteItems = chargeItems.filter(
    (item) => !favoriteItems.includes(item)
  );
  let selectedItems = [...favoriteItems, ...nonFavoriteItems].slice(0, 6);
  let listChargeItem = ``;
  chargeTrackerDiv.innerHTML = "";
  selectedItems.forEach((item, index) => {
    let imgSrc = item.img || "/icons/svg/mystery-man.svg";
    let charges = item.system.uses?.value ?? 0;
    let maxCharges = item.system.uses?.max ?? 0;
    let isFavorite = favoriteItems.some((fav) => fav.id === item.id);
    listChargeItem += `
       <div class="heraldHud-chargeItem" data-item-id="${item.id}" title="${
      item.name
    }">
        <img src="${imgSrc}" class="heraldHud-chargeImage" alt="${item.name}">
        <div class="heraldHud-chargeText">${charges}/${maxCharges}</div>
        <div class="heraldHud-chargeTrackerTooltip">${item.name}</div>
         ${
           isFavorite
             ? '<div class="heraldHud-chargeFavoriteIcon"><i class="fa-solid fa-sparkle"></i></div>'
             : ""
         }
      </div>`;
  });

  if (chargeTrackerDiv) {
    chargeTrackerDiv.innerHTML = listChargeItem;

    document
      .querySelectorAll(".heraldHud-chargeItem")
      .forEach((itemElement) => {
        itemElement.addEventListener("click", async () => {
          let itemId = itemElement.getAttribute("data-item-id");

          let item =
            actor.items.get(itemId) ||
            actor.getEmbeddedDocument("Item", itemId);

          if (item) {
            await item.use();
            let chargeText = itemElement.querySelector(".heraldHud-chargeText");
            chargeText.textContent = `${item.system.uses.value}/${item.system.uses.max}`;
          }
        });
      });
  }
}

Hooks.on("updateActor", async (actor, data) => {
  await heraldHud_updateDataActor();
  await heraldHud_updateMovementsActor();
  await heraldHud_updateItemFavoriteActor();
  await heraldHud_updateItemCosumablesActor();
  await heraldHud_getDataSpellsSlot();
  console.log("test update actor");
});

function darkenHex(hex, percent) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function heraldHud_getGameIconDamage(type) {
  const basePath = "/systems/dnd5e/icons/svg/damage/";
  const validTypes = {
    acid: "Acid",
    bludgeoning: "Bludgeoning",
    cold: "Cold",
    fire: "Fire",
    force: "Force",
    lightning: "Lightning",
    necrotic: "Necrotic",
    piercing: "Piercing",
    poison: "Poison",
    psychic: "Psychic",
    radiant: "Radiant",
    slashing: "Slashing",
    thunder: "Thunder",
    healing: "Healing",
    temphp: "Temporary HP",
  };

  let iconType = validTypes[type] ? type : "";
  let tooltipText = validTypes[type] || "Unknown";

  return `
    <div class="heraldHud-damageIconContainer">
      <img src="${basePath}${iconType}.svg" width="13" height="13" style="border:none; filter:invert(1);">
      <div class="heraldHud-damageTooltip">${tooltipText}</div>
    </div>
  `;
}

function heraldHud_getCurrencyIcon(type) {
  const currencyIcons = {
    pp: {
      src: "/systems/dnd5e/icons/currency/platinum.webp",
      label: "Platinum",
    },
    gp: { src: "/systems/dnd5e/icons/currency/gold.webp", label: "Gold" },
    ep: {
      src: "/systems/dnd5e/icons/currency/electrum.webp",
      label: "Electrum",
    },
    sp: { src: "/systems/dnd5e/icons/currency/silver.webp", label: "Silver" },
    cp: { src: "/systems/dnd5e/icons/currency/copper.webp", label: "Copper" },
  };

  let iconData = currencyIcons[type];

  return `
    <div class="heraldHud-currencyIconContainer">
      <img src="${iconData.src}" >
      <div class="heraldHud-currencyTooltip">${iconData.label}</div>
    </div>
  `;
}

function heraldHud_getSpellIcons(item) {
  if (!item.system || !item.system.properties) return "";

  let icons = [];
  let properties = Array.from(item.system.properties); // Konversi Set ke Array

  let spellIcons = {
    vocal: { label: "Verbal", symbol: "V" },
    somatic: { label: "Somatic", symbol: "S" },
    material: { label: "Material", symbol: "M" },
    concentration: {
      label: "Concentration",
      icon: "systems/dnd5e/icons/svg/statuses/concentrating.svg",
    },
    ritual: {
      label: "Ritual",
      icon: "systems/dnd5e/icons/svg/items/spell.svg",
    },
  };

  properties.forEach((prop) => {
    if (spellIcons[prop]) {
      if (spellIcons[prop].symbol) {
        icons.push(`
          <div class="heraldHud-spellComponentContainer">
            <span class="heraldHud-spellComponentName">${spellIcons[prop].symbol}</span>
            <div class="heraldHud-spellsComponentTooltip">${spellIcons[prop].label}</div>
          </div>
        `);
      } else if (spellIcons[prop].icon) {
        icons.push(`
          <div class="heraldHud-spellComponentContainer">
            <img src="${spellIcons[prop].icon}" class="heraldHud-spellComponentIcon">
            <div class="heraldHud-spellsComponentTooltip">${spellIcons[prop].label}</div>
          </div>
        `);
      }
    }
  });

  return icons.join(" ");
}

function heraldHud_getSpellsSchoolIcon(schoolCode) {
  const spellSchoolMap = {
    abj: {
      name: "Abjuration",
      icon: "abjuration",
      color: "#00AEEF",
      filter:
        "invert(57%) sepia(88%) saturate(3986%) hue-rotate(170deg) brightness(97%) contrast(101%)",
    },
    con: {
      name: "Conjuration",
      icon: "conjuration",
      color: "#F68D2E",
      filter:
        "invert(67%) sepia(91%) saturate(1096%) hue-rotate(359deg) brightness(102%) contrast(100%)",
    },
    div: {
      name: "Divination",
      icon: "divination",
      color: "#A65EFF",
      filter:
        "invert(58%) sepia(47%) saturate(2539%) hue-rotate(244deg) brightness(103%) contrast(98%)",
    },
    enc: {
      name: "Enchantment",
      icon: "enchantment",
      color: "#FF4ECC",
      filter:
        "invert(53%) sepia(78%) saturate(2177%) hue-rotate(295deg) brightness(102%) contrast(98%)",
    },
    evo: {
      name: "Evocation",
      icon: "evocation",
      color: "#ED1C24",
      filter:
        "invert(20%) sepia(92%) saturate(4372%) hue-rotate(355deg) brightness(98%) contrast(107%)",
    },
    ill: {
      name: "Illusion",
      icon: "illusion",
      color: "#FFDD00",
      filter:
        "invert(84%) sepia(49%) saturate(576%) hue-rotate(357deg) brightness(108%) contrast(103%)",
    },
    nec: {
      name: "Necromancy",
      icon: "necromancy",
      color: "#008A5E",
      filter:
        "invert(22%) sepia(92%) saturate(738%) hue-rotate(138deg) brightness(99%) contrast(102%)",
    },
    trs: {
      name: "Transmutation",
      icon: "transmutation",
      color: "#00B3B3",
      filter:
        "invert(42%) sepia(94%) saturate(1418%) hue-rotate(148deg) brightness(100%) contrast(99%)",
    },
  };

  let spellSchool = spellSchoolMap[schoolCode] || {
    name: "Unknown",
    icon: "unknown",
    color: "#888888",
    filter:
      "invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
  };

  let iconPath = `/systems/dnd5e/icons/svg/schools/${spellSchool.icon}.svg`;

  return `
    <div class="heraldHud-spellSchoolContainer" style="border-color: ${spellSchool.color};">
      <img src="${iconPath}" class="heraldHud-spellSchoolIcon" alt="${spellSchool.name}" style="filter: ${spellSchool.filter};">
      <div class="heraldHud-spellsSchoolTooltip" style="">
        ${spellSchool.name}
      </div>
    </div>
  `;
}
function heraldHud_getSpellsPrepSchoolIcon(schoolCode) {
  const spellSchoolMap = {
    abj: {
      name: "Abjuration",
      icon: "abjuration",
      color: "#00AEEF",
      filter:
        "invert(57%) sepia(88%) saturate(3986%) hue-rotate(170deg) brightness(97%) contrast(101%)",
    },
    con: {
      name: "Conjuration",
      icon: "conjuration",
      color: "#F68D2E",
      filter:
        "invert(67%) sepia(91%) saturate(1096%) hue-rotate(359deg) brightness(102%) contrast(100%)",
    },
    div: {
      name: "Divination",
      icon: "divination",
      color: "#A65EFF",
      filter:
        "invert(58%) sepia(47%) saturate(2539%) hue-rotate(244deg) brightness(103%) contrast(98%)",
    },
    enc: {
      name: "Enchantment",
      icon: "enchantment",
      color: "#FF4ECC",
      filter:
        "invert(53%) sepia(78%) saturate(2177%) hue-rotate(295deg) brightness(102%) contrast(98%)",
    },
    evo: {
      name: "Evocation",
      icon: "evocation",
      color: "#ED1C24",
      filter:
        "invert(20%) sepia(92%) saturate(4372%) hue-rotate(355deg) brightness(98%) contrast(107%)",
    },
    ill: {
      name: "Illusion",
      icon: "illusion",
      color: "#FFDD00",
      filter:
        "invert(84%) sepia(49%) saturate(576%) hue-rotate(357deg) brightness(108%) contrast(103%)",
    },
    nec: {
      name: "Necromancy",
      icon: "necromancy",
      color: "#008A5E",
      filter:
        "invert(22%) sepia(92%) saturate(738%) hue-rotate(138deg) brightness(99%) contrast(102%)",
    },
    trs: {
      name: "Transmutation",
      icon: "transmutation",
      color: "#00B3B3",
      filter:
        "invert(42%) sepia(94%) saturate(1418%) hue-rotate(148deg) brightness(100%) contrast(99%)",
    },
  };

  let spellSchool = spellSchoolMap[schoolCode] || {
    name: "Unknown",
    icon: "unknown",
    color: "#888888",
    filter:
      "invert(50%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
  };

  let iconPath = `/systems/dnd5e/icons/svg/schools/${spellSchool.icon}.svg`;

  return `
    <div class="heraldHud-spellPrepSchoolContainer" style="border-color: ${spellSchool.color};">
      <img src="${iconPath}" class="heraldHud-spellPrepSchoolIcon" alt="${spellSchool.name}" style="filter: ${spellSchool.filter};">
      <div class="heraldHud-spellsPrepSchoolTooltip" style="">
        ${spellSchool.name}
      </div>
    </div>
  `;
}
export { heraldHud_renderHtml, heraldHud_renderHeraldHud };
