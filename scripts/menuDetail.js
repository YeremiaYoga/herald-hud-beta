let heraldHud_menuDetailSocket;

Hooks.once("socketlib.ready", () => {
  heraldHud_menuDetailSocket = socketlib.registerModule("herald-hud-beta");
  heraldHud_menuDetailSocket.register(
    "createPersonalNotesFolder",
    async (user) => {
      await heraldHud_gmCreatePersonalNotesFolder(user);
    }
  );

  heraldHud_menuDetailSocket.register(
    "heraldHudCreatePersonalNotes",
    async (user, input, type) => {
      await heraldHud_createPersonalNotes(user, input, type);
    }
  );

  heraldHud_menuDetailSocket.register(
    "createPartyJournalFolder",
    async (user) => {
      await heraldHud_gmCreatePartyJournalFolder(user);
    }
  );

  heraldHud_menuDetailSocket.register(
    "heraldHudCreatePartyJournal",
    async (user, input, type) => {
      await heraldHud_createPartyJournal(user, input, type);
    }
  );
});
async function heraldHud_renderListMenu() {
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  let arrMenu = [
    `biography`,
    `personal_notes`,
    `party_journal`,
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
  } else if (kategori == `party_journal`) {
    await heraldHud_getViewPartyJournal();
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
  heraldHud_menuDetailSocket.executeAsGM("createPersonalNotesFolder", user);
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogListPersonalNotesContainer" class="heraldHud-dialogListPersonalNotesContainer">
        <div id="heraldHud-listPersonalNotesTopContiner" class="heraldHud-listPersonalNotesTopContiner"></div>
        <div id="heraldHud-listPersonalNotesMiddleContainer" class="heraldHud-listPersonalNotesMiddleContainer"></div>
        <div id="heraldHud-listPersonalNotesBottomContainer" class="heraldHud-listPersonalNotesBottomContainer">
          <div class="heraldHud-searchPersonalNotesContainer">
            <input type="text" id="heraldHud-searchPersonalNotes" class="heraldHud-searchPersonalNotes" placeholder="Search notes..." />
          </div>
          <div id="heraldHud-buttonAddPersonalNotesContainer" class="heraldHud-buttonAddPersonalNotesContainer">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>`;

    let searchPersonalNotes = document.getElementById(
      "heraldHud-searchPersonalNotes"
    );
    let inputSearchTimeOut;
    searchPersonalNotes.addEventListener("input", () => {
      clearTimeout(inputSearchTimeOut);

      inputSearchTimeOut = setTimeout(async () => {
        await heraldHud_renderListPersonalNotesMiddleContainer();
      }, 500);
    });

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
              <div>
                <label for="heraldHud-personalNotesType"><strong>Type</strong></label>
                <input id="heraldHud-personalNotesType" type="text" style="width: 100%;" placeholder="Enter Type ..."/>
              </div>
            
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

              const typeInput = html
                .find("#heraldHud-personalNotesType")
                .val()
                ?.trim();
              if (!personalNotesInput)
                return ui.notifications.warn("Please enter a note name.");

              heraldHud_menuDetailSocket.executeAsGM(
                "heraldHudCreatePersonalNotes",
                user,
                personalNotesInput,
                typeInput
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

async function heraldHud_createPersonalNotes(user, input, type) {
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
  await JournalEntry.create({
    name: input,
    content: "",
    folder: playerFolder.id,
    flags: {
      type: type,
    },
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

  let searchPersonalNotes = document.getElementById(
    "heraldHud-searchPersonalNotes"
  );
  let valueSearch = "";
  if (searchPersonalNotes) {
    valueSearch = searchPersonalNotes.value.toLowerCase();
  }

  let filteredPersonalNotes = [];

  for (let data of personalNotesJournal) {
    let journalName = data.name.toLowerCase();
    if (journalName.indexOf(valueSearch) !== -1) {
      filteredPersonalNotes.push(data);
    }
  }
  let groupedNotes = {};
  let notesWithoutType = [];

  for (let journal of filteredPersonalNotes) {
    console.log(journal.flags);
    let journalName = journal.name;
    let type = journal.flags?.type || "";

    if (type) {
      if (!groupedNotes[type]) {
        groupedNotes[type] = "";
      }

      groupedNotes[type] += `
        <div id="heraldHud-personalNotesContainer" class="heraldHud-personalNotesContainer" data-id="${journal.id}">
          <div id="heraldHud-personalNotesLeftContainer" class="heraldHud-personalNotesLeftContainer">
            <div id="heraldHud-personalNotesName" class="heraldHud-personalNotesName">${journalName}</div>
          </div>
          <div id="heraldHud-personalNotesMiddleContainer" class="heraldHud-personalNotesMiddleContainer">
          </div>
          <div id="heraldHud-personalNotesRightContainer" class="heraldHud-personalNotesRightContainer">
            <div id="heraldHud-buttonEditPersonalNotesContainer" class="heraldHud-buttonEditPersonalNotesContainer" data-id="${journal.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div id="heraldHud-buttonDeletePersonalNotesContainer" class="heraldHud-buttonDeletePersonalNotesContainer" data-id="${journal.id}">
              <i class="fa-solid fa-trash"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      notesWithoutType.push(`
        <div id="heraldHud-personalNotesContainer" class="heraldHud-personalNotesContainer" data-id="${journal.id}">
          <div id="heraldHud-personalNotesLeftContainer" class="heraldHud-personalNotesLeftContainer">
            <div id="heraldHud-personalNotesName" class="heraldHud-personalNotesName">${journalName}</div>
          </div>
          <div id="heraldHud-personalNotesMiddleContainer" class="heraldHud-personalNotesMiddleContainer">
          </div>
          <div id="heraldHud-personalNotesRightContainer" class="heraldHud-personalNotesRightContainer">
            <div id="heraldHud-buttonEditPersonalNotesContainer" class="heraldHud-buttonEditPersonalNotesContainer" data-id="${journal.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div id="heraldHud-buttonDeletePersonalNotesContainer" class="heraldHud-buttonDeletePersonalNotesContainer" data-id="${journal.id}">
              <i class="fa-solid fa-trash"></i>
            </div>
          </div>
        </div>
      `);
    }
  }

  let listPersonalNotes = "";
  let sortedTypes = Object.keys(groupedNotes).sort();
  for (let type of sortedTypes) {
    listPersonalNotes += `
     <div style="display:flex; align-items:center;" >
      <div style="color:white; font-size:18px; padding-bottom:5px; font-weight:bold;">${
        type.charAt(0).toUpperCase() + type.slice(1)
      }</div>
      <hr style="flex-grow: 1; border: none; border-top: 2px solid white; margin-left:5px;" />
    </div>
    
    `;
    listPersonalNotes += groupedNotes[type];
  }

  if (notesWithoutType.length > 0) {
    listPersonalNotes += `
    <div style="display:flex;">
      <div style="color:white; font-size:18px; padding-bottom:5px; font-weight:bold;">Other</div>
      <hr style="flex-grow: 1; border: none; border-top: 2px solid white; margin-left:5px;" />
    </div>
    `;
    listPersonalNotes += notesWithoutType.join("");
  }

  if (dialogMiddle) {
    dialogMiddle.innerHTML = listPersonalNotes;

    const noteContainers = dialogMiddle.querySelectorAll(
      ".heraldHud-personalNotesContainer"
    );

    noteContainers.forEach((container) => {
      container.addEventListener("click", async (event) => {
        if (
          event.target.closest(
            ".heraldHud-buttonDeletePersonalNotesContainer"
          ) ||
          event.target.closest(".heraldHud-buttonEditPersonalNotesContainer")
        )
          return;

        const journalId = container.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        if (journal) {
          journal.sheet.render(true);
        }
      });
    });

    const editButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonEditPersonalNotesContainer"
    );

    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        let journalId = this.dataset.id;
        let journal = filteredPersonalNotes.find((j) => j.id === journalId);

        const dialogContent = `
          <form>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
              <label for="heraldHud-personalNotesEditNameInput"><strong>Name for Journal</strong></label>
              <textarea id="heraldHud-personalNotesEditNameInput" rows="3" style="width: 100%;">${
                journal.name
              }</textarea>
              <div>
                <label for="heraldHud-personaleNotesEditTypeInput"><strong>Type</strong></label>
                <input id="heraldHud-personaleNotesEditTypeInput" type="text" style="width: 100%;" value="${
                  journal.flags?.type || ""
                }" />
              </div>
            </div>
          </form>
        `;

        const dialogOptions = {
          title: `Edit Journal`,
          content: dialogContent,
          buttons: {
            save: {
              label: "Save",
              callback: async (html) => {
                let newName = html
                  .find("#heraldHud-personalNotesEditNameInput")
                  .val();
                let newType = html
                  .find("#heraldHud-personaleNotesEditTypeInput")
                  .val();

                journal.name = newName;
                journal.flags = journal.flags || {};
                journal.flags.type = newType;
                await game.journal.get(journal.id).update({
                  name: newName,
                  flags: { type: newType },
                });

                await heraldHud_renderListPersonalNotesMiddleContainer();
              },
            },
            cancel: {
              label: "Cancel",
              callback: () => {},
            },
          },
          default: "save",
          render: async (html) => {},
        };
        new Dialog(dialogOptions).render(true);
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

async function heraldHud_gmCreatePersonalNotesFolder(user) {
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
  const hexColor = `${user.color.toString(16).padStart(6, "0")}`;
  if (!playerFolder) {
    playerFolder = await Folder.create({
      name: user.name,
      type: "JournalEntry",
      folder: personalNotesFolder.id,
      color: hexColor,
    });
  }
}

/* ---------------------------------------------
   DIALOG PARTY NOTES
--------------------------------------------- */

async function heraldHud_gmCreatePartyJournalFolder(user) {
  let heraldHudFolder = game.folders.find(
    (f) => f.name === "Herald Hud" && f.type === "JournalEntry" && !f.folder
  );

  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }

  let partyJournalFolder = game.folders.find(
    (f) => f.folder?.id === heraldHudFolder.id
  );
  if (!partyJournalFolder) {
    partyJournalFolder = await Folder.create({
      name: "Party Journal",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }
  let playerFolder = game.folders.find(
    (f) => f.name === user.name && f.type === "JournalEntry"
  );
  const hexColor = `${user.color.toString(16).padStart(6, "0")}`;
  if (!playerFolder) {
    playerFolder = await Folder.create({
      name: user.name,
      type: "JournalEntry",
      folder: partyJournalFolder.id,
      color: hexColor,
    });
  }
}

async function heraldHud_createPartyJournal(user, input, type) {
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
  await JournalEntry.create({
    name: input,
    content: "",
    folder: playerFolder.id,
    flags: {
      type: type,
    },
    ownership: { default: 3 },
  });
}

async function heraldHud_getViewPartyJournal() {
  const user = game.user;
  const selectedActor = user.character;
  // heraldHud_menuDetailSocket.executeAsGM("createPartyJournalFolder", user);
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogListPartyJournalContainer" class="heraldHud-dialogListPartyJournalContainer">
        <div id="heraldHud-listPartyJournalTopContiner" class="heraldHud-listPartyJournalTopContiner"></div>
        <div id="heraldHud-listPartyJournalMiddleContainer" class="heraldHud-listPartyJournalMiddleContainer"></div>
        <div id="heraldHud-listPartyJournalBottomContainer" class="heraldHud-listPartyJournalBottomContainer">
          <div class="heraldHud-searchPartyJournalContainer" style="display:none;">
            <input type="text" id="heraldHud-searchPartyJournal" class="heraldHud-searchPartyJournal" placeholder="Search notes..." />
          </div>
          <div id="heraldHud-buttonAddPartyJournalContainer" class="heraldHud-buttonAddPersonalNotesContainer">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>
    `;

    let addPartyJournal = document.getElementById(
      "heraldHud-buttonAddPersonalNotesContainer"
    );

    addPersonalNotes.addEventListener("click", async () => {
      const heraldCoreFolder = game.folders.find(
        (f) => f.name === "Herald Core" && f.type === "JournalEntry"
      );
      if (!heraldCoreFolder) {
        console.warn("Herald Core folder not found.");
        return;
      }
      const partyFolder = game.folders.find(
        (f) =>
          f.name === "Party" &&
          f.type === "JournalEntry" &&
          f.folder?.id === heraldCoreFolder.id
      );

      const partyJournals = game.journal.filter(
        (j) => j.folder?.id === partyFolder.id
      );
      new Dialog({
        title: "Personal Notes",
        content: `
          <form>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
              <label for="heraldHud-personalNotesInput"><strong>Name for Journal</strong></label>
              <textarea id="heraldHud-personalNotesInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
              <div>
                <label for="heraldHud-personalNotesType"><strong>Type</strong></label>
                <input id="heraldHud-personalNotesType" type="text" style="width: 100%;" placeholder="Enter Type ..."/>
              </div>
            
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

              const typeInput = html
                .find("#heraldHud-personalNotesType")
                .val()
                ?.trim();
              if (!personalNotesInput)
                return ui.notifications.warn("Please enter a note name.");

              heraldHud_menuDetailSocket.executeAsGM(
                "heraldHudCreatePersonalNotes",
                user,
                personalNotesInput,
                typeInput
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
}

export { heraldHud_renderListMenu };
