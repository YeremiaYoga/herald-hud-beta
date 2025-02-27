let heraldHud_actorSelected = null;
let heraldHud_checkerValue = null;

let hp0 = "#8B0000";
let hp25 = "#bc3c04";
let hp50 = "#c47404";
let hp75 = "#8c9c04";
let hp100 = "#389454";
let hpgradient = "rgb(34, 34, 34)";

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
    await heraldHud_renderHeraldHud();
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
    { id: "spells", text: "Spells" },
    { id: "stats", text: "Stats" },
  ];

  actions.forEach((action) => {
    let container = document.createElement("div");
    container.id = `heraldHud-${action.id}Container`;
    container.className = `heraldHud-${action.id}Container`;

    let button = document.createElement("div");
    button.id = `heraldHud-${action.id}Button`;
    button.className = `heraldHud-${action.id}Button`;
    button.textContent = action.text;

    let tooltip = document.createElement("div");
    tooltip.id = `heraldHud-${action.id}Tooltip`;
    tooltip.className = `heraldHud-${action.id}Tooltip`;

    button.addEventListener("click", async () => {
      await heraldHud_showDialog(action.id);
    });

    container.appendChild(button);
    container.appendChild(tooltip);

    actionContainerDiv.appendChild(container);
  });

  let rightHudShortcutContainerDiv = document.getElementById(
    "heraldHud-rightHudShortcutContainer"
  );

  if (rightHudShortcutContainerDiv) {
    rightHudShortcutContainerDiv.innerHTML = `
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
}

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
    if (actor) await actor.rollInitiative();
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
      favItem.addEventListener("click", async function () {
        let itemId = this.getAttribute("data-item-id");

        let item =
          actor.items.get(itemId) || actor.getEmbeddedDocument("Item", itemId);

        if (item) {
          await item.use();
        }
      });
      const tooltip = document.getElementById("heraldHud-favoriteItemTooltip");
      favItem.addEventListener("mouseenter", (event) => {
        let itemName = favItem.getAttribute("data-name");
        tooltip.innerText = itemName;
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
      });

      favItem.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
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
    let itemName = `${item.name} (x${item.system.quantity})`;
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
            }
          }
        });
        const tooltip = document.getElementById(
          "heraldHud-consumableItemTooltip"
        );
        favItem.addEventListener("mouseenter", (event) => {
          let itemName = favItem.getAttribute("data-name");
          tooltip.innerText = itemName;
          tooltip.style.opacity = "1";
          tooltip.style.visibility = "visible";
        });

        favItem.addEventListener("mouseleave", () => {
          tooltip.style.opacity = "0";
          tooltip.style.visibility = "hidden";
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
  } else if (kategori == "features") {
    await heraldHud_renderItemFeatures();
  } else if (kategori == "spells") {
  } else if (kategori == "stats") {
  }
}
async function heraldHud_renderDialog(kategori) {
  let heraldHud_dialogContainerDiv = document.getElementById(
    "heraldHud-dialogContainer"
  );
  if (heraldHud_dialogContainerDiv) {
    console.log(kategori);
    heraldHud_dialogContainerDiv.innerHTML = `
    <div id="heraldHud-dialog" class="heraldHud-dialog ${kategori}"></div>`;
  }
}

async function heraldHud_resetDialog() {
  let heraldHud_dialogContainerDiv = document.getElementById(
    "heraldHud-dialogContainer"
  );
  if (heraldHud_dialogContainerDiv) {
    heraldHud_dialogContainerDiv.innerHTML = "";
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

  let weaponsItem = actor.items.filter((item) => item.type === "weapon");
  let toolsItem = actor.items.filter((item) => item.type === "tool");
  let consumablesItem = actor.items.filter(
    (item) => item.type === "consumable"
  );

  let weaponDiv = ``;
  let toolDiv = ``;
  let consumableDiv = ``;
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

function getDamageIcon(type) {
  const basePath = "/systems/dnd5e/icons/svg/damage/"; // Path ikon di Foundry
  const validTypes = [
    "acid",
    "bludgeoning",
    "cold",
    "fire",
    "force",
    "lightning",
    "necrotic",
    "piercing",
    "poison",
    "psychic",
    "radiant",
    "slashing",
    "thunder",
  ];

  if (validTypes.includes(type)) {
    return `<img src="${basePath}${type}.svg" width="13" height="13" style=" border:none; filter: invert(1);">`;
  }

  return `<img src="${basePath}default.svg" width="13" height="13" style="vertical-align:middle; border:none; filter: invert(1);">`;
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
    let htmlDescription = item.system.description.value;
    let arrProperti = [];
    let labelProperti = "";

    let abilityMod = item.system.abilityMod
      ? actor.system.abilities[item.system.abilityMod]?.mod
      : "";
    if (item.labels.toHit) {
      arrProperti.push(`To hit ${item.labels.toHit}`);
    }
    if (item.labels.save) {
      arrProperti.push(item.labels.save);
    }
    if (item.labels.damage) {
      for (let damage of item.labels.derivedDamage) {
        let damageIcon = getDamageIcon(damage.damageType);

        arrProperti.push(`${damage.formula} ${damageIcon}`);
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
    let arrCategory = [];
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
      arrCategory.push(category);
    }
    let weaponitemUses = "";

    if (item.system.uses?.value && item.system.uses?.max) {
      weaponitemUses = `${item.system.uses.value}/${item.system.uses.max}`;
    }

    if (weaponitemUses) {
      arrCategory.push(weaponitemUses);
    }

    let labelCategory = ``;

    if (arrCategory.length > 0) {
      labelCategory = arrCategory.join(" | ");
    }

    console.log(item.system.uses);
    listWeapons += `
    <div id="heraldHud-dialogWeaponContainer" class="heraldHud-dialogWeaponContainer">
      <div id="heraldHud-dialogWeaponItem" class="heraldHud-dialogWeaponItem" data-item-id="${item.id}">
          <div id="heraldHud-weaponLeft" class="heraldHud-weaponLeft">
              <div class="heraldHud-dialogWeaponImageContainer">
                 <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogWeaponImage">
              </div>
          </div>
          <div id="heraldHud-weaponMiddle" class="heraldHud-weaponMiddle">
            <div id="heraldHud-weaponName" class="heraldHud-weaponName">${item.name}</div>
            <div id="heraldHud-weaponCategory-${item.id}" class="heraldHud-weaponCategory">${labelCategory}</div>
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
    let htmlDescription = item.system.description.value;
    listTools += ` 
    <div id="heraldHud-dialogToolContainer" class="heraldHud-dialogToolContainer">
        <div id="heraldHud-dialogToolItem" class="heraldHud-dialogToolItem" data-item-id="${item.id}">
          <div id="heraldHud-toolLeft" class="heraldHud-toolLeft">
            <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogToolImage">
          </div>
          <div id="heraldHud-toolMiddle" class="heraldHud-toolMiddle">
            <div id="heraldHud-toolName" class="heraldHud-toolName">${item.name}</div>
            <div id="heraldHud-toolCategory" class="heraldHud-toolCategory">${item.system.type.label}</div>
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
    let htmlDescription = item.system.description.value;

    let consumableItemUses = "";

    if (item.system.uses?.value && item.system.uses?.max) {
      consumableItemUses = `${item.system.uses.value}/${item.system.uses.max}`;
    }

    listConsumables += `
    <div id="heraldHud-dialogConsumableContainer" class="heraldHud-dialogConsumableContainer">
      <div id="heraldHud-dialogConsumableItem" class="heraldHud-dialogConsumableItem" data-item-id="${item.id}">
          <div id="heraldHud-consumableLeft" class="heraldHud-consumableLeft">
            <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogConsumableImage">
          </div>
          <div id="heraldHud-consumableMiddle" class="heraldHud-consumableMiddle">
            <div id="heraldHud-consumableName" class="heraldHud-consumableName">${item.name}</div>
            <div id="heraldHud-consumableCategory-${item.id}" class="heraldHud-consumableCategory" >${item.system.type.label} | ${consumableItemUses}</div>
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
              let categoryConsumableDiv = document.getElementById(
                `heraldHud-consumableCategory-${item.id}`
              );
              let consumableItemUses = "";

              if (
                updatedItem.system.uses?.value &&
                updatedItem.system.uses?.max
              ) {
                consumableItemUses = `${updatedItem.system.uses.value}/${updatedItem.system.uses.max}`;
              }
              if (categoryConsumableDiv) {
                categoryConsumableDiv.innerText = `${updatedItem.system.type.label} | ${consumableItemUses}`;
              }
            }
          }
        });
      });
  }
}

async function heraldHud_renderItemLoots() {}
async function heraldHud_getDataLoots() {}

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
  featuresItem.forEach((item) => {
    if (item.system.activation?.type) {
      let category = ``;
      if (item.labels.activation.includes("Bonus Action")) {
        category = `<i class="fa-solid fa-square-plus" style="color:#d5530b;"></i> Bonus Action`;
      } else if (item.labels.activation.includes("Reaction")) {
        category = `<i class="fa-solid fa-rotate-right" style="color:#fe85f6;"></i> Reaction`;
      } else if (item.labels.activation.includes("Legendary Action")) {
        category = `<i class="fa-solid fa-dragon" style="color:#0a35d1;"></i> Legendary Action`;
      } else {
        category = `<i class="fa-solid fa-circle" style="color:#1f6237;"></i> Action`;
      }
      let featureUses = ``;

      if (item.system.uses.value && item.system.uses.max) {
        featureUses = `${item.system.uses.value} / ${item.system.uses.max}`;
      }
      listFeaturesActive += `
        <div id="heraldHud-dialogFeaturesContainer" class="heraldHud-dialogFeaturesContainer">
          <div id="heraldHud-dialogFeaturesItem" class="heraldHud-dialogFeaturesItem" data-item-id="${item.id}">
            <div id="heraldHud-dialogFeaturesLeft" class="heraldHud-dialogFeaturesLeft">
              <div class="heraldHud-dialogFeaturesImageContainer">
                <img src="${item.img}" alt="${item.name}" class="heraldHud-dialogFeaturesImage">
              </div>
              <div>
              test
              </div>
            </div>
            <div id="heraldHud-dialogFeaturesMiddle" class="heraldHud-dialogFeaturesMiddle">
             <div id="heraldHud-dialogFeaturesName" class="heraldHud-dialogFeaturesName">${item.name}</div>
             <div id="heraldHud-dialogFeaturesCategory" class="heraldHud-dialogFeaturesCategory">${category}</div>
              <div id="heraldHud-dialogFeaturesUses" class="heraldHud-dialogFeaturesUses">
              ${featureUses}
              </div>
            </div>
            <div id="heraldHud-dialogFeaturesRight" class="heraldHud-dialogFeaturesRight">
             
            </div>
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
          }
        });
      });
  }

  if (featuresPassiveDiv) {
    featuresPassiveDiv.innerHTML = listFeaturesPassive;
  }
}

Hooks.on("updateActor", async (actor, data) => {
  await heraldHud_updateDataActor();
  await heraldHud_updateMovementsActor();
  await heraldHud_updateItemFavoriteActor();
  await heraldHud_updateItemCosumablesActor();
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

export { heraldHud_renderHtml, heraldHud_renderHeraldHud };
