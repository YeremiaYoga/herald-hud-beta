let heraldHud_actorSelected = null;

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

  console.log(heraldHud_actorSelected);
}

async function heraldHud_getActorData() {
  const user = game.user;
  console.log(user);
  let sceneListActor = game.scenes.viewed.tokens
    .filter((t) => t.actor.type === "character")
    .map((t) => t.actor);
  for (let actor of sceneListActor) {
    if (actor.ownership[user.id]) {
      if (actor.ownership[user.id] == 3) {
        console.log(actor);
        heraldHud_actorSelected = actor;
        break;
      }
    }
  }
}

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

  let actionContainerDiv = document.getElementById("heraldHud-actionContainer");
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

  if (hpBarDiv) {
    let actorhpvaluebar = 0;

    actorhpvaluebar = 310 - hpPercent;

    hpBarDiv.style.strokeDashoffset = actorhpvaluebar;
  }
  let hpValueDiv = document.getElementById("heraldHud-hpValue");

  if (hpValueDiv) {
    hpValueDiv.innerText = hp + "/" + totalMaxHp;
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

  if (tempHp) {
    let tempHpValueDiv = document.getElementById("heraldHud-tempHpValue");
    let tempHpBarContainerDiv = document.getElementById(
      "heraldHud-tempHpBarContainer"
    );

    let tempHpBarLeftDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);

    let tempHpBarRightDiv = document.querySelector(`.heraldHud-tempHpBarLeft`);

    let tempHpCircleLeftDiv = document.getElementById("heraldHud-tempHpLeft");
    let tempHpCircleRightDiv = document.getElementById("heraldHud-tempHpRight");
    if (tempHpValueDiv) {
      tempHpValueDiv.innerText = `+${tempHp}`;
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
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  id="heraldHud-tempHpLeft"
                  class="heraldHud-tempHpLeft"
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
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  id="heraldHud-tempHpRight"
                  class="heraldHud-tempHpRight"
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
  }

  let acValueDiv = document.getElementById("heraldHud-acValue");
  if (acValueDiv) {
    acValueDiv.innerText = acValue;
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
          <div id="heraldHud-burrowSpeedIcon" class="heraldHud-burrowSpeedIcon"><i class="fa-solid fa-shovel" ></i></div>
          <div id="heraldHud-burrowSpeedValue" class="heraldHud-burrowSpeedValue">${actor.system.attributes.movement.burrow}</div>
        </div>
      </div>
    `;
  }
  if (actor.system.attributes.movement.climb) {
    climbSpeedValue = `
     <div id="heraldHud-climbSpeedContainer" class="heraldHud-climbSpeedContainer">
        <div id="heraldHud-climbSpeedWrapper" class="heraldHud-climbSpeedWrapper">
          <div id="heraldHud-climbSpeedIcon" class="heraldHud-climbSpeedIcon"> <i class="fa-solid fa-hill-rockslide" ></i></div>
          <div id="heraldHud-climbSpeedValue" class="heraldHud-climbSpeedValue">${actor.system.attributes.movement.climb}</div>
        </div>
      </div>
    `;
  }
  if (actor.system.attributes.movement.fly) {
    flySpeedValue = `
     <div id="heraldHud-flySpeedContainer" class="heraldHud-flySpeedContainer">
        <div id="heraldHud-flySpeedWrapper" class="heraldHud-flySpeedWrapper">
          <div id="heraldHud-flySpeedIcon" class="heraldHud-flySpeedIcon"> <i class="fa-solid fa-dove" ></i></div>
          <div id="heraldHud-flySpeedValue" class="heraldHud-flySpeedValue">${actor.system.attributes.movement.fly}</div>
        </div>
      </div>
    `;
  }
  if (actor.system.attributes.movement.swim) {
    swimSpeedValue = `
     <div id="heraldHud-swimSpeedContainer" class="heraldHud-swimSpeedContainer">
        <div id="heraldHud-swimSpeedWrapper" class="heraldHud-swimSpeedWrapper">
          <div id="heraldHud-swimSpeedIcon" class="heraldHud-swimSpeedIcon"> <i class="fa-brands fa-fly" ></i></div>
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
});

export { heraldHud_renderHtml, heraldHud_renderHeraldHud };
