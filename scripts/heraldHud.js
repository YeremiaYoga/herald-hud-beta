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
  console.log(data.character);
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

    button.addEventListener("click", () => {
      console.log(`${action.text} clicked!`);
    });

    container.appendChild(button);
    container.appendChild(tooltip);

    actionContainerDiv.appendChild(container);
  });

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
  let consumablesItem = actor.items.filter(
    (item) => item.type === "consumable"
  );
  console.log(consumablesItem);
}

Hooks.on("updateActor", async (actor, data) => {
  await heraldHud_updateDataActor();
  await heraldHud_updateMovementsActor();
  await heraldHud_updateItemFavoriteActor();
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
