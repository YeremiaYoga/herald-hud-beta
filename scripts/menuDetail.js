let heraldHud_menuDetailSocket;

Hooks.once("socketlib.ready", () => {
  heraldHud_menuDetailSocket = socketlib.registerModule("herald-hud-beta");
  heraldHud_menuDetailSocket.register(
    "createFolderHeraldHudJournal",
    async (user) => {
      await heraldHud_gmCreateJournalFolder(user);
    }
  );

  heraldHud_menuDetailSocket.register(
    "heraldHudCreatePersonalNotes",
    async (user, input) => {
      await heraldHud_createPersonalNotes(user, input);
    }
  );
});
async function heraldHud_renderListMenu() {
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  let arrMenu = [
    `biography`,
    `personal_notes`,
    `party_notes`,
    `mission`,
    `npcs`,
  ];
  let listMenu = ``;
  for (let menu of arrMenu) {
    let menuTitle = menu
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    listMenu += `
        <div id="heraldHud-menuDetailItem" class="heraldHud-menuDetailItem" data-name="${menu}">
            <div class="heraldHud-menuDetailName">
                ${menuTitle}
            </div>
        </div>
        `;
  }
  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
        <div class="heraldHud-menuDetailListItem">
            ${listMenu}
        </div> `;

    document
      .querySelectorAll(".heraldHud-menuDetailItem")
      .forEach((menuDetail) => {
        menuDetail.addEventListener("click", async function () {
          let name = this.getAttribute("data-name");
          await heraldHud_showDialogSubMenuDetail(name);
        });
      });
  }
}

async function heraldHud_showDialogSubMenuDetail(kategori) {
  await heraldHud_showDialog2MenuDetail(kategori);
  if (kategori == "biography") {
    await heraldHud_getViewBiography();
  } else if (kategori == `personal_notes`) {
    await heraldHud_getViewPersonalNotes();
  } else if (kategori == `party_notes`) {
  } else if (kategori == `mission`) {
  }
}

async function heraldHud_showDialog2MenuDetail(kategori) {
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    if (heraldHud_dialog2Div.style.display == "none") {
      heraldHud_dialog2Div.style.display = "block";
      heraldHud_dialog2Div.classList.add(`${kategori}`);
    } else {
      heraldHud_dialog2Div.className = "heraldHud-dialog2";
      heraldHud_dialog2Div.style.display = "none";
    }
  }
}

async function heraldHud_getViewBiography() {
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");
  let arrInputTop = [
    "alignment",
    "eyes",
    "height",
    "faith",
    "hair",
    "weight",
    "gender",
    "skin",
    "age",
  ];

  let listTopBiographyMenu = ``;
  for (let data of arrInputTop) {
    listTopBiographyMenu += `
    <div class="heraldHud-topInputBiographyWrapper">
      <label for="heraldHud-topInputBiographyField-${data}" class="heraldHud-topInputBiographyLabel">${data.toUpperCase()} :</label>
      <input type="text" id="heraldHud-topInputBiographyField-${data}" name="${data}" class="heraldHud-topInputBiographyField" />
    </div>
  `;
  }
  let arrInputMiddle = {
    ideals: "fas fa-seedling",
    personality_traits: "fas fa-puzzle-piece",
    bonds: "fas fa-link",
    appearance: "fas fa-image-portrait",
    flaws: "fas fa-heart-crack",
  };
  let listMiddleBiographyMenu = ``;
  for (let [key, value] of Object.entries(arrInputMiddle)) {
    listMiddleBiographyMenu += `
    <div class="heraldHud-middleInputBiographyWrapper">
      <label for="heraldHud-middleInputBiographyField-${key}" class="heraldHud-middleInputBiographyLabel">${key
      .split("_")
      .join(" ")
      .toUpperCase()}</label>
      <hr class="heraldHud-middleInputBiographyDivider" />
      <textarea id="heraldHud-middleInputBiographyField-${key}" name="${key}" class="heraldHud-middleInputBiographyField" rows="3"></textarea>
    </div>
  `;
  }

  let arrInputBottom = {
    biography: "fas fa-seedling",
  };
  let listBottomBiographyMenu = ``;
  for (let [key, value] of Object.entries(arrInputBottom)) {
    listBottomBiographyMenu += `
    <div class="heraldHud-middleInputBiographyWrapper">
      <label for="heraldHud-bottomInputBiographyField-${key}" class="heraldHud-bottomInputBiographyLabel">${key
      .split("_")
      .join(" ")
      .toUpperCase()}</label>
      <hr class="heraldHud-bottomInputBiographyDivider" />
      <textarea id="heraldHud-bottomInputBiographyField-${key}" name="${key}" class="heraldHud-bottomInputBiographyField" rows="3"></textarea>
    </div>
  `;
  }

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
        <div id="heraldHud-menuBiographyContainer" class="heraldHud-menuBiographyContainer">
            <div id="heraldHud-biographyTopContainer" class="heraldHud-biographyTopContainer">
                ${listTopBiographyMenu}
            </div>
            <div id="heraldHud-biographyMiddleContainer" class="heraldHud-biographyMiddleContainer">
                ${listMiddleBiographyMenu}
            </div>
            <div id="heraldHud-biographyBottomContainer" class="heraldHud-biographyBottomContainer">
                ${listBottomBiographyMenu}
            </div>
        </div>`;
  }
  await heraldHud_getDataBiographyTop();
  await heraldHud_getDataBiographyMiddle();
  await heraldHud_getDataBiographyBottom();
}
async function heraldHud_getDataBiographyTop() {
  const user = game.user;
  let selectedActor = user.character;

  let topInputData = {
    alignment: selectedActor.system?.details?.alignment,
    eyes: selectedActor.system?.details?.eyes,
    height: selectedActor.system?.details?.height,
    faith: selectedActor.system?.details?.faith,
    hair: selectedActor.system?.details?.hair,
    weight: selectedActor.system?.details?.weight,
    gender: selectedActor.system?.details?.gender,
    skin: selectedActor.system?.details?.skin,
    age: selectedActor.system?.details?.age,
  };
  let topTimeoutInput = {};
  for (let [key, value] of Object.entries(topInputData)) {
    let inputTop = document.getElementById(
      `heraldHud-topInputBiographyField-${key}`
    );
    if (inputTop) {
      inputTop.value = value || "";
    }

    inputTop.addEventListener("input", () => {
      if (topTimeoutInput[key]) clearTimeout(topTimeoutInput[key]);

      topTimeoutInput[key] = setTimeout(async () => {
        await selectedActor.update({
          [`system.details.${key}`]: inputTop.value,
        });
      }, 5000);
    });
    inputTop.addEventListener("blur", async () => {
      if (topTimeoutInput[key]) {
        clearTimeout(topTimeoutInput[key]);
        delete topTimeoutInput[key];
      }
      await selectedActor.update({ [`system.details.${key}`]: inputTop.value });
    });
  }
}

async function heraldHud_getDataBiographyMiddle() {
  const user = game.user;
  let selectedActor = user.character;

  let middleInputData = {
    ideals: `${selectedActor.system?.details?.ideal}|ideal`,
    personality_traits: `${selectedActor.system?.details?.trait}|trait`,
    bonds: `${selectedActor.system?.details?.bond}|bond`,
    appearance: `${selectedActor.system?.details?.appearance}|appearance`,
    flaws: `${selectedActor.system?.details?.flaw}|flaw`,
  };
  let middleTimeoutInput = {};
  for (let [key, value] of Object.entries(middleInputData)) {
    let inputMiddle = document.getElementById(
      `heraldHud-middleInputBiographyField-${key}`
    );
    let arrValue = value.split("|");

    if (inputMiddle) {
      inputMiddle.value = arrValue[0] || "";
    }

    inputMiddle.addEventListener("input", () => {
      if (middleTimeoutInput[arrValue[1]])
        clearTimeout(middleTimeoutInput[arrValue[1]]);

      middleTimeoutInput[arrValue[1]] = setTimeout(async () => {
        await selectedActor.update({
          [`system.details.${arrValue[1]}`]: inputMiddle.value,
        });
      }, 5000);
    });
    inputMiddle.addEventListener("blur", async () => {
      if (middleTimeoutInput[arrValue[1]]) {
        clearTimeout(middleTimeoutInput[arrValue[1]]);
        delete middleTimeoutInput[arrValue[1]];
      }
      await selectedActor.update({
        [`system.details.${arrValue[1]}`]: inputMiddle.value,
      });
    });
  }
}

async function heraldHud_getDataBiographyBottom() {
  const user = game.user;
  let selectedActor = user.character;
  console.log(selectedActor);

  let biographyValue = selectedActor.system?.details?.biography.value || "";
  console.log(biographyValue);
  let bottomTimeoutInput = {};
  let inputBottom = document.getElementById(
    `heraldHud-bottomInputBiographyField-biography`
  );

  let div = document.createElement("div");
  div.innerHTML = biographyValue;
  let finalValue = div.textContent || div.innerText || "";
  if (inputBottom) {
    inputBottom.value = finalValue;
  }
  inputBottom.addEventListener("input", () => {
    if (bottomTimeoutInput["biography"])
      clearTimeout(bottomTimeoutInput["biography"]);

    bottomTimeoutInput["biography"] = setTimeout(async () => {
      await selectedActor.update({
        [`system.details.biography.value`]: inputBottom.value,
      });
    }, 5000);
  });
  inputBottom.addEventListener("blur", async () => {
    if (bottomTimeoutInput["biography"]) {
      clearTimeout(bottomTimeoutInput["biography"]);
      delete bottomTimeoutInput["biography"];
    }
    await selectedActor.update({
      [`system.details.biography.value`]: inputBottom.value,
    });
  });
}

async function heraldHud_getViewPersonalNotes() {
  const user = game.user;
  heraldHud_menuDetailSocket.executeAsGM("createFolderHeraldHudJournal", user);
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogListPersonalNotesContainer" class="heraldHud-dialogListPersonalNotesContainer">
        <div id="heraldHud-listPersonalNotesTopContiner" class="heraldHud-listPersonalNotesTopContiner"></div>
        <div id="heraldHud-listPersonalNotesMiddleContainer" class="heraldHud-listPersonalNotesMiddleContainer"></div>
        <div id="heraldHud-listPersonalNotesBottomContainer" class="heraldHud-listPersonalNotesBottomContainer">
          <div id="heraldHud-buttonAddPersonalNotesContainer" class="heraldHud-buttonAddPersonalNotesContainer">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>`;

    let addPersonalNotes = document.getElementById(
      "heraldHud-buttonAddPersonalNotesContainer"
    );

    addPersonalNotes.addEventListener("click", async () => {
      new Dialog({
        title: "Personal Notes",
        content: `
          <form>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
              <label for="heraldHud-personalNotesInput"><strong>Name for Journal</strong></label>
              <textarea id="heraldHud-personalNotesInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
            </div>
          </form>
        `,
        buttons: {
          save: {
            label: "Save",
            callback: async (html) => {
              const personalNotesInput = html
                .find("#heraldHud-personalNotesInput")
                .val()
                ?.trim();
              if (!personalNotesInput)
                return ui.notifications.warn("Please enter a note name.");

              heraldHud_menuDetailSocket.executeAsGM(
                "heraldHudCreatePersonalNotes",
                user,
                personalNotesInput
              );
              setTimeout(async () => {
                await heraldHud_renderListPersonalNotesMiddleContainer();
              }, 500);
            },
          },
          cancel: {
            label: "Cancel",
            callback: () => {},
          },
        },
        default: "save",
      }).render(true);
    });
  }
  await heraldHud_renderListPersonalNotesMiddleContainer();
}

async function heraldHud_createPersonalNotes(user, input) {
  let heraldHudFolder = game.folders.find(
    (f) => f.name === "Herald Hud" && f.type === "JournalEntry"
  );

  let personalNotesFolder = game.folders.find(
    (f) =>
      f.name === "Personal Notes" &&
      f.type === "JournalEntry" &&
      f.folder?.id === heraldHudFolder.id
  );
  const playerFolder = game.folders.find(
    (f) =>
      f.name === user.name &&
      f.type === "JournalEntry" &&
      f.folder?.id === personalNotesFolder.id
  );

  if (!playerFolder) {
    return ui.notifications.error("Player folder not found.");
  }
  let userId = user.id;
  await JournalEntry.create({
    name: input,
    content: "",
    folder: playerFolder.id,
    ownership: { default: 3 },
  });
}

async function heraldHud_renderListPersonalNotesMiddleContainer() {
  const user = game.user;
  let dialogMiddle = document.getElementById(
    "heraldHud-listPersonalNotesMiddleContainer"
  );

  let heraldHudFolder = game.folders.find(
    (f) => f.name === "Herald Hud" && f.type === "JournalEntry"
  );

  let personalNotesFolder = game.folders.find(
    (f) =>
      f.name === "Personal Notes" &&
      f.type === "JournalEntry" &&
      f.folder?.id === heraldHudFolder.id
  );

  let playerFolder = game.folders.find(
    (f) =>
      f.name === user.name &&
      f.type === "JournalEntry" &&
      f.folder?.id === personalNotesFolder.id
  );
  if (!playerFolder) {
    return;
  }
  let personalNotesJournal = game.journal.filter(
    (j) => j.folder?.id === playerFolder.id
  );
  let listPersonalNotes = ``;
  for (let journal of personalNotesJournal) {
    let journalName = journal.name;
    listPersonalNotes += `
      <div id="heraldHud-personalNotesContainer" class="heraldHud-personalNotesContainer" data-id="${journal.id}">
        <div id="heraldHud-personalNotesLeftContainer" class="heraldHud-personalNotesLeftContainer">
          <div id="heraldHud-personalNotesName" class="heraldHud-personalNotesName">${journalName}</div>
        </div>
        <div id="heraldHud-personalNotesMiddleContainer" class="heraldHud-personalNotesMiddleContainer">
        </div>
        <div id="heraldHud-personalNotesRightContainer" class="heraldHud-personalNotesRightContainer">
          <div id="heraldHud-buttonDeletePersonalNotesContainer" class="heraldHud-buttonDeletePersonalNotesContainer" data-id="${journal.id}">
            <i class="fa-solid fa-trash"></i>
          </div>
        </div>
      </div>
    `;
  }

  if (dialogMiddle) {
    dialogMiddle.innerHTML = listPersonalNotes;

    const noteContainers = dialogMiddle.querySelectorAll(
      ".heraldHud-personalNotesContainer"
    );

    noteContainers.forEach((container) => {
      container.addEventListener("click", async (event) => {
        if (
          event.target.closest(".heraldHud-buttonDeletePersonalNotesContainer")
        )
          return;

        const journalId = container.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        if (journal) {
          journal.sheet.render(true);
        }
      });
    });

    const deleteButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonDeletePersonalNotesContainer"
    );
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const journalId = button.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        if (!journal) return;

        new Dialog({
          title: "Delete Personal Note",
          content: `<p>Are you sure you want to delete the note ?</p>`,
          buttons: {
            confirm: {
              label: "Delete",
              callback: async () => {
                await journal.delete();
                await heraldHud_renderListPersonalNotesMiddleContainer();
              },
            },
            cancel: {
              label: "Cancel",
              callback: () => {},
            },
          },
          default: "cancel",
        }).render(true);
      });
    });
  }
}

async function heraldHud_gmCreateJournalFolder(user) {
  let heraldHudFolder = game.folders.find(
    (f) => f.name === "Herald Hud" && f.type === "JournalEntry" && !f.folder
  );

  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }

  let personalNotesFolder = game.folders.find(
    (f) => f.folder?.id === heraldHudFolder.id
  );
  if (!personalNotesFolder) {
    personalNotesFolder = await Folder.create({
      name: "Personal Notes",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }
  let playerFolder = game.folders.find(
    (f) => f.name === user.name && f.type === "JournalEntry"
  );

  if (!playerFolder) {
    playerFolder = await Folder.create({
      name: user.name,
      type: "JournalEntry",
      folder: personalNotesFolder.id,
    });
  }
}

export { heraldHud_renderListMenu };
