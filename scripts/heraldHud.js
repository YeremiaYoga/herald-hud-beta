let heraldHud_actorSelected = null;

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

  hpValueInput.addEventListener("blur", delayedUpdate);
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
        <stop offset="70%" stop-color="${hp0}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      } else if (hpPercent <= 25) {
        hpGradientColor.innerHTML = `
        <stop offset="70%" stop-color="${hp25}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      } else if (hpPercent <= 50) {
        hpGradientColor.innerHTML = `
        <stop offset="70%" stop-color="${hp50}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      } else if (hpPercent <= 75) {
        hpGradientColor.innerHTML = `
        <stop offset="70%" stop-color="${hp75}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      } else {
        hpGradientColor.innerHTML = `
        <stop offset="70%" stop-color="${hp100}" />
        <stop offset="100%" stop-color="${hpgradient}"/>`;
      }
      if (hpValueInput) {
        hpValueInput.value = hp;
      }
    } else {
      let temphpValue = hp;
      let negativeBlockMax = hp + totalMaxHp;
      if (negativeBlockMax < 0) {
        temphpValue = totalMaxHp * -1;

        await actor.data.update({
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

      if (hpValueInput) {
        hpValueInput.value = temphpValue;
      }
    }
  }

  let hpMaxValueDiv = document.getElementById("heraldHud-hpMaxValue");

  if (hpMaxValueDiv) {
    hpMaxValueDiv.innerText = "/ " + totalMaxHp;
  }

  if (tempmaxhp) {
    let tempMaxHpValueDiv = document.getElementById("heraldHud-tempHpMaxValue");
    if (tempMaxHpValueDiv) {
      if (tempmaxhp > 0) {
        tempMaxHpValueDiv.innerText = `(+${tempmaxhp})`;
        tempMaxHpValueDiv.style.color = "#05b4ff";
      } else {
        tempMaxHpValueDiv.innerText = `(${tempmaxhp})`;
        tempMaxHpValueDiv.style.color = "#b0001d";
      }
    }
  }
  let tempPlusIconDiv = document.getElementById("heraldHud-tempPlusIcon");
  let tempHpBarLeftDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);

  let tempHpBarRightDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);
  let tempHpCircleLeftDiv = document.getElementById("heraldHud-tempHpLeft");
  let tempHpCircleRightDiv = document.getElementById("heraldHud-tempHpRight");
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

  let initiativeValue = actor.system.attributes.init.bonus;
  if (initiativeValueDiv) {
    initiativeValueDiv.innerText = `+${initiativeValue || 0}`;
  }
}

async function heraldHud_updateEffectActor() {
  let actor = heraldHud_actorSelected;
  let effectlist = ``;
  let arrEffect = [];

  for (let effect of actor.data.effects) {
    arrEffect.push(effect);
  }
  for (let item of actor.data.items) {
    if (item.effects) {
      for (let effect of item.effects) {
        arrEffect.push(effect);
      }
    }
  }

  let activeEffect = ``;
  let disableEffect = ``;
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

async function heraldHud_updateItemCosumablesActor() {}

Hooks.on("updateActor", async (actor, data) => {
  await heraldHud_updateDataActor();
  await heraldHud_updateMovementsActor();
});

export { heraldHud_renderHtml, heraldHud_renderHeraldHud };
