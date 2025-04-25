let heraldHud_menuDetailSocket;

Hooks.once("socketlib.ready", () => {
  heraldHud_menuDetailSocket = socketlib.registerModule("herald-hud-beta");
  heraldHud_menuDetailSocket.register(
    "createPersonalNotesFolder",
    async (user) => {
      const folders = game.folders.filter((f) => f.type === "JournalEntry");
      let heraldHudFolder = "";
      let personalNotesFolder = "";
      let playerFolder = "";
      for (let folder of folders) {
        if (folder.name == "Herald Hud") {
          heraldHudFolder = folder;
        }

        if (
          folder.name == "Personal Notes" &&
          folder.folder.id == heraldHudFolder.id
        ) {
          personalNotesFolder = folder;
        }
        if (
          folder.name == user.name &&
          folder.folder.id == personalNotesFolder.id
        ) {
          playerFolder = folder;
        }
      }
      if (!heraldHudFolder || !personalNotesFolder || !playerFolder) {
        await heraldHud_gmCreatePersonalNotesFolder(user);
      }
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
      const folders = game.folders.filter((f) => f.type === "JournalEntry");

      const heraldHudFolder = folders.find((f) => f.name === "Herald Hud");
      const partyJournalFolder = folders.find(
        (f) =>
          f.name === "Party Journal" && f.folder?.id === heraldHudFolder?.id
      );
      const playerFolder = folders.find(
        (f) => f.name === user.name && f.folder?.id === partyJournalFolder?.id
      );

      if (!heraldHudFolder || !partyJournalFolder || !playerFolder) {
        await heraldHud_gmCreatePartyJournalFolder(user);
      }
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
      const folders = game.folders.filter((f) => f.type === "JournalEntry");
      let heraldHudFolder = "";
      let personalNotesFolder = "";
      let playerFolder = "";
      for (let folder of folders) {
        if (folder.name == "Herald Hud") {
          heraldHudFolder = folder;
        }

        if (
          folder.name == "Personal Notes" &&
          folder.folder.id == heraldHudFolder.id
        ) {
          personalNotesFolder = folder;
        }
        if (
          folder.name == user.name &&
          folder.folder.id == personalNotesFolder.id
        ) {
          playerFolder = folder;
        }
      }

      let personalNotesJournal = game.journal.filter(
        (j) => j.folder?.id === playerFolder.id
      );

      let typesSet = new Set();
      for (let journal of personalNotesJournal) {
        let type = journal.flags?.type;
        if (type) typesSet.add(type);
      }

      let radioButton = "";
      for (let type of [...typesSet].sort()) {
        radioButton += `
          <div>
            <input type="radio" id="heraldHud-type-${type}" name="heraldHud-personalNotesTypeRadio" value="${type}">
            <label for="heraldHud-type-${type}">${type}</label>
          </div>
        `;
      }

      new Dialog({
        title: "Personal Notes",
        content: `
          <form>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px; overflow-y:auto;height:200px;">
              <label for="heraldHud-personalNotesInput"><strong>Name for Journal</strong></label>
              <textarea id="heraldHud-personalNotesInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
              <div>
                <label for="heraldHud-personalNotesType"><strong>Type</strong></label>
                <input id="heraldHud-personalNotesType" type="text" style="width: 100%;" placeholder="Enter Type ..."/>
              </div>
              <div id="heraldHud-personalNotesRadioTypeContainer">
                <label><strong>Or choose from existing:</strong></label>
                ${radioButton}
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
              const selectedRadio = html
                .find("input[name='heraldHud-personalNotesTypeRadio']:checked")
                .val();

              const finalType = typeInput || selectedRadio || "";
              if (!personalNotesInput)
                return ui.notifications.warn("Please enter a note name.");

              heraldHud_menuDetailSocket.executeAsGM(
                "heraldHudCreatePersonalNotes",
                user,
                personalNotesInput,
                finalType
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
      Hooks.once("renderDialog", async (app) => {
        if (app instanceof Dialog && app.title === "Personal Notes") {
          const width = 350;
          const height = 300;

          app.setPosition({
            left: (window.innerWidth - width) / 2,
            top: (window.innerHeight - height) / 2,
            width: width,
            height: height,
            scale: 1.0,
          });
        }
        let inputTypeTimeout;
        let inputType = document.getElementById("heraldHud-personalNotesType");
        let radioTypeContainer = document.getElementById(
          "heraldHud-personalNotesRadioTypeContainer"
        );
        inputType.addEventListener("input", () => {
          clearTimeout(inputTypeTimeout);

          inputTypeTimeout = setTimeout(() => {
            if (inputType.value == "") {
              radioTypeContainer.innerHTML = `
              <label><strong>Or choose from existing:</strong></label>
                ${radioButton}
              `;
            } else {
              radioTypeContainer.innerHTML = ``;
            }
          }, 500);
        });
      });
    });
  }
  await heraldHud_renderListPersonalNotesMiddleContainer();
}

async function heraldHud_createPersonalNotes(user, input, type) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldHudFolder = "";
  let personalNotesFolder = "";
  let playerFolder = "";
  for (let folder of folders) {
    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (
      folder.name == "Personal Notes" &&
      folder.folder.id == heraldHudFolder.id
    ) {
      personalNotesFolder = folder;
    }
    if (
      folder.name == user.name &&
      folder.folder.id == personalNotesFolder.id
    ) {
      playerFolder = folder;
    }
  }
  console.log(playerFolder);
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

    let pagesHTML = "";
    for (let page of journal.pages) {
      pagesHTML += `
        <div class="heraldHud-personalNotesPage" data-journal-id="${journal.id}" data-page-id="${page.id}">
          <div class="heraldHud-personalNotesPageName">- ${page.name}</div>
        </div>
      `;
    }
    if (type) {
      if (!groupedNotes[type]) {
        groupedNotes[type] = "";
      }

      groupedNotes[type] += `
      <div id="heraldHud-personalNotesWrapperContainer" class="heraldHud-personalNotesWrapperContainer">
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
        <div id="heraldHud-personalNotesPagesContainer" class="heraldHud-personalNotesPagesContainer">
          ${pagesHTML}
        </div>
      </div>
      
      `;
    } else {
      notesWithoutType.push(`
        <div id="heraldHud-personalNotesWrapperContainer" class="heraldHud-personalNotesWrapperContainer">
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
          <div id="heraldHud-personalNotesPagesContainer" class="heraldHud-personalNotesPagesContainer">
            ${pagesHTML}
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

        let personalNotesJournal = game.journal.filter(
          (j) => j.folder?.id === playerFolder.id
        );
        let typesSet = new Set();
        for (let journal of personalNotesJournal) {
          let type = journal.flags?.type;
          if (type) typesSet.add(type);
        }

        let journalId = this.dataset.id;
        let journal = filteredPersonalNotes.find((j) => j.id === journalId);

        let radioButton = "";
        let typeExist = false;
        let flagsType = ``;
        for (let type of [...typesSet].sort()) {
          let isChecked = "";
          if (journal.flags?.type == type) {
            typeExist = true;
            isChecked = "checked";
          }
          radioButton += `
            <div>
              <input type="radio" id="heraldHud-typeRadio-${type}" name="heraldHud-personalNotesEditTypeRadio" value="${type}" ${isChecked}>
              <label for="heraldHud-typeRadio-${type}">${type}</label>
            </div>
          `;
        }
        if (!typeExist) {
          flagsType = journal.flags?.type;
        }
        let radioButtonDiv = ``;
        if (flagsType == ``) {
          radioButtonDiv = `
            <label><strong>Or choose from existing:</strong></label>
            ${radioButton}
          `;
        }

        const dialogContent = `
          <form>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;overflow-y:auto;height:200px;">
              <label for="heraldHud-personalNotesEditNameInput"><strong>Name for Journal</strong></label>
              <textarea id="heraldHud-personalNotesEditNameInput" rows="3" style="width: 100%;">${
                journal.name
              }</textarea>
              <div>
                <label for="heraldHud-personalNotesEditTypeInput"><strong>Type</strong></label>
                <input id="heraldHud-personalNotesEditTypeInput" type="text" style="width: 100%;" value="${
                  flagsType || ""
                }" />
              </div>
              <div id="heraldHud-personalNotesEditRadioTypeContainer" disabled>
                ${radioButtonDiv}
              </div>
            </div>
          </form>
        `;

        const dialogOptions = {
          title: `Edit Personal Notes`,
          content: dialogContent,
          buttons: {
            save: {
              label: "Save",
              callback: async (html) => {
                let newName = html
                  .find("#heraldHud-personalNotesEditNameInput")
                  .val();
                let newType = html
                  .find("#heraldHud-personalNotesEditTypeInput")
                  .val();
                let selectedRadio = html
                  .find(
                    "input[name='heraldHud-personalNotesEditTypeRadio']:checked"
                  )
                  .val();
                const finalType = newType || selectedRadio || "";
                journal.name = newName;
                journal.flags = journal.flags || {};
                journal.flags.type = finalType;
                await game.journal.get(journal.id).update({
                  name: newName,
                  flags: { type: finalType },
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
        Hooks.once("renderDialog", async (app) => {
          if (app instanceof Dialog && app.title === "Edit Personal Notes") {
            const width = 350;
            const height = 300;

            app.setPosition({
              left: (window.innerWidth - width) / 2,
              top: (window.innerHeight - height) / 2,
              width: width,
              height: height,
              scale: 1.0,
            });
          }
          let inputTypeTimeout;
          let inputType = document.getElementById(
            "heraldHud-personalNotesEditTypeInput"
          );
          let radioTypeContainer = document.getElementById(
            "heraldHud-personalNotesEditRadioTypeContainer"
          );
          inputType.addEventListener("input", () => {
            clearTimeout(inputTypeTimeout);

            inputTypeTimeout = setTimeout(() => {
              if (inputType.value == "") {
                radioTypeContainer.innerHTML = `
                <label><strong>Or choose from existing:</strong></label>
                  ${radioButton}
                `;
              } else {
                radioTypeContainer.innerHTML = ``;
              }
            }, 500);
          });
        });
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

    const pages = document.querySelectorAll(".heraldHud-personalNotesPage");
    pages.forEach((pageEl) => {
      pageEl.addEventListener("click", async () => {
        const journalId = pageEl.getAttribute("data-journal-id");
        const pageId = pageEl.getAttribute("data-page-id");

        const journal = game.journal.get(journalId);
        if (!journal) return;

        journal.sheet.render(true, {
          pageId: pageId,
        });
      });
    });
  }
}

async function heraldHud_gmCreatePersonalNotesFolder(user) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldHudFolder = "";
  let personalNotesFolder = "";
  let playerFolder = "";
  for (let folder of folders) {
    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (
      folder.name == "Personal Notes" &&
      folder.folder.id == heraldHudFolder.id
    ) {
      personalNotesFolder = folder;
    }
    if (
      folder.name == user.name &&
      folder.folder.id == personalNotesFolder.id
    ) {
      playerFolder = folder;
    }
  }

  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }

  if (!personalNotesFolder) {
    personalNotesFolder = await Folder.create({
      name: "Personal Notes",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }

  if (!playerFolder) {
    const hexColor = `${user.color.toString(16).padStart(6, "0")}`;
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
    (f) =>
      f.name === "Party Journal" &&
      f.type === "JournalEntry" &&
      f.folder === heraldHudFolder.id
  );
  if (!partyJournalFolder) {
    partyJournalFolder = await Folder.create({
      name: "Party Journal",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }
  let playerFolder = game.folders.find(
    (f) =>
      f.name === user.name &&
      f.type === "JournalEntry" &&
      f.folder === partyJournalFolder.id
  );
  console.log(playerFolder);
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

  let partyJournal = game.folders.find(
    (f) =>
      f.name === "Party Journal" &&
      f.type === "JournalEntry" &&
      f.folder?.id === heraldHudFolder.id
  );
  const playerFolder = game.folders.find(
    (f) =>
      f.name === user.name &&
      f.type === "JournalEntry" &&
      f.folder?.id === partyJournal.id
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
  heraldHud_menuDetailSocket.executeAsGM("createPartyJournalFolder", user);
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogListPartyJournalContainer" class="heraldHud-dialogListPartyJournalContainer">
        <div id="heraldHud-listPartyJournalTopContiner" class="heraldHud-listPartyJournalTopContiner"></div>
        <div id="heraldHud-listPartyJournalMiddleContainer" class="heraldHud-listPartyJournalMiddleContainer"></div>
        <div id="heraldHud-listPartyJournalBottomContainer" class="heraldHud-listPartyJournalBottomContainer">
          <div class="heraldHud-searchPartyJournalContainer" >
            <input type="text" id="heraldHud-searchPartyJournal" class="heraldHud-searchPartyJournal" placeholder="Search notes..." />
          </div>
          <div id="heraldHud-buttonAddPartyJournalContainer" class="heraldHud-buttonAddPersonalNotesContainer">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>
    `;

    let addPartyJournal = document.getElementById(
      "heraldHud-buttonAddPartyJournalContainer"
    );
    if (addPartyJournal) {
      addPartyJournal.addEventListener("click", async () => {
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
        let userUuid = user.uuid;
        let actorUuid = selectedActor.uuid;
        let listRadioButton = ``;
        for (let journal of partyJournals) {
          for (let page of journal.pages) {
            if (page.name === `${userUuid} | ${actorUuid}`) {
              listRadioButton += `
          <div style="margin-bottom:4px;">
            <input
              type="radio"
              id="heraldHud-partyJournal-${journal.id}"
              name="heraldHud-partyJournalType"
              value="${journal.name}"
            />
            <label
              for="heraldHud-partyJournal-${journal.id}"
              style=""
            >${journal.name}</label>
          </div>
        `;
            }
          }
        }

        new Dialog({
          title: "Party Journal",
          content: `
        <form>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
            <label for="heraldHud-partyJournalInput"><strong>Name for Journal</strong></label>
            <textarea id="heraldHud-partyJournalInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style=""><strong>Which Party</strong></div>
            ${
              listRadioButton ||
              `<div style=" font-style:italic;">No journals found</div>`
            }
          </div>
        </form>
      `,
          buttons: {
            save: {
              label: "Create",
              callback: (html) => {
                const partyJournalName = html
                  .find("#heraldHud-partyJournalInput")
                  .val();
                const selectedJournalId = html
                  .find("input[name='heraldHud-partyJournalType']:checked")
                  .val();
                console.log(
                  "Name:",
                  name,
                  "Selected Journal ID:",
                  selectedJournalId
                );

                heraldHud_menuDetailSocket.executeAsGM(
                  "heraldHudCreatePartyJournal",
                  user,
                  partyJournalName,
                  selectedJournalId
                );
                setTimeout(async () => {
                  await heraldHud_renderListPartyJournalMiddleContainer();
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
  await heraldHud_renderListPartyJournalMiddleContainer();
}

async function heraldHud_renderListPartyJournalMiddleContainer() {
  const user = game.user;
  const selectedActor = user.character;
  let dialogMiddle = document.getElementById(
    "heraldHud-listPartyJournalMiddleContainer"
  );

  let heraldHudFolder = game.folders.find(
    (f) => f.name === "Herald Hud" && f.type === "JournalEntry"
  );

  let partyJournalFolder = game.folders.find(
    (f) =>
      f.name === "Party Journal" &&
      f.type === "JournalEntry" &&
      f.folder?.id === heraldHudFolder.id
  );

  let playerFolder = game.folders.find(
    (f) =>
      f.name === user.name &&
      f.type === "JournalEntry" &&
      f.folder?.id === partyJournalFolder.id
  );
  if (!playerFolder) {
    return;
  }
  let partyJournalList = game.journal.filter(
    (j) => j.folder?.id === playerFolder.id
  );

  let searchPartyJournal = document.getElementById(
    "heraldHud-searchPartyJournal"
  );
  let valueSearch = "";
  if (searchPartyJournal) {
    valueSearch = searchPartyJournal.value.toLowerCase();
  }

  let filteredPartyJournal = [];

  for (let data of partyJournalList) {
    let journalName = data.name.toLowerCase();
    if (journalName.indexOf(valueSearch) !== -1) {
      filteredPartyJournal.push(data);
    }
  }

  let groupedPartyJournal = {};
  let journalWithoutType = [];

  for (let journal of filteredPartyJournal) {
    let journalName = journal.name;
    let type = journal.flags?.type || "";

    if (type) {
      if (!groupedPartyJournal[type]) {
        groupedPartyJournal[type] = "";
      }

      groupedPartyJournal[type] += `
        <div id="heraldHud-partyJournalContainer" class="heraldHud-partyJournalContainer" data-id="${journal.id}">
          <div id="heraldHud-partyJournalLeftContainer" class="heraldHud-partyJournalLeftContainer">
            <div id="heraldHud-partyJournalName" class="heraldHud-partyJournalName">${journalName}</div>
          </div>
          <div id="heraldHud-partyJournalMiddleContainer" class="heraldHud-partyJournalMiddleContainer">
          </div>
          <div id="heraldHud-partyJournalRightContainer" class="heraldHud-partyJournalRightContainer">
            <div id="heraldHud-buttonEditPartyJournalContainer" class="heraldHud-buttonEditPartyJournalContainer" data-id="${journal.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div id="heraldHud-buttonDeletePartyJournalContainer" class="heraldHud-buttonDeletePartyJournalContainer" data-id="${journal.id}">
              <i class="fa-solid fa-trash"></i>
            </div>
          </div>
        </div>
      `;
    } else {
      journalWithoutType.push(`
        <div id="heraldHud-partyJournalContainer" class="heraldHud-partyJournalContainer" data-id="${journal.id}">
          <div id="heraldHud-partyJournalLeftContainer" class="heraldHud-partyJournalLeftContainer">
            <div id="heraldHud-partyJournalName" class="heraldHud-partyJournalName">${journalName}</div>
          </div>
          <div id="heraldHud-partyJournalMiddleContainer" class="heraldHud-partyJournalMiddleContainer">
          </div>
          <div id="heraldHud-partyJournalRightContainer" class="heraldHud-partyJournalRightContainer">
            <div id="heraldHud-buttonEditPartyJournalContainer" class="heraldHud-buttonEditPartyJournalContainer" data-id="${journal.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </div>
            <div id="heraldHud-buttonDeletePartyJournalContainer" class="heraldHud-buttonDeletePartyJournalContainer" data-id="${journal.id}">
              <i class="fa-solid fa-trash"></i>
            </div>
          </div>
        </div>
      `);
    }
  }

  let listPartyJournal = "";
  let sortedTypes = Object.keys(groupedPartyJournal).sort();

  for (let type of sortedTypes) {
    listPartyJournal += `
     <div style="display:flex; align-items:center;" >
      <div style="color:white; font-size:18px; padding-bottom:5px; font-weight:bold;">${
        type.charAt(0).toUpperCase() + type.slice(1)
      }</div>
      <hr style="flex-grow: 1; border: none; border-top: 2px solid white; margin-left:5px;" />
    </div>
    
    `;
    listPartyJournal += groupedPartyJournal[type];
  }

  if (journalWithoutType.length > 0) {
    listPartyJournal += `
    <div style="display:flex;">
      <div style="color:white; font-size:18px; padding-bottom:5px; font-weight:bold;">Other</div>
      <hr style="flex-grow: 1; border: none; border-top: 2px solid white; margin-left:5px;" />
    </div>
    `;
    listPartyJournal += journalWithoutType.join("");
  }

  if (dialogMiddle) {
    dialogMiddle.innerHTML = listPartyJournal;

    const partyJournalContainer = dialogMiddle.querySelectorAll(
      ".heraldHud-partyJournalContainer"
    );

    partyJournalContainer.forEach((container) => {
      container.addEventListener("click", async (event) => {
        if (
          event.target.closest(".heraldHud-buttonDeletePartyJournalContainer")
        ) {
          return;
        }

        if (
          event.target.closest(".heraldHud-buttonEditPartyJournalContainer")
        ) {
          return;
        }

        const journalId = container.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        if (journal) {
          journal.sheet.render(true);
        }
      });
    });

    const editButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonEditPartyJournalContainer"
    );

    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
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
        let userUuid = user.uuid;
        let actorUuid = selectedActor.uuid;
        let listRadioButton = ``;
        const journalId = button.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        for (let pj of partyJournals) {
          console.log(pj);
          for (let page of pj.pages) {
            if (page.name === `${userUuid} | ${actorUuid}`) {
              const checked = pj.name === journal.flags?.type ? "checked" : "";
              listRadioButton += `
          <div style="margin-bottom:4px;">
            <input
              type="radio"
              id="heraldHud-partyJournal-${pj.id}"
              name="heraldHud-partyJournalEditType"
              value="${pj.name}"
              ${checked}
            />
            <label
              for="heraldHud-partyJournal-${pj.id}"
              style=""
            >${pj.name}</label>
          </div>
        `;
            }
          }
        }
        new Dialog({
          title: "Edit Party Journal",
          content: `
        <form>
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
            <label for="heraldHud-partyJournalEditInput"><strong>Name for Journal</strong></label>
            <textarea id="heraldHud-partyJournalEditInput"  rows="3" style="width: 100%;" placeholder="Enter Name ...">${
              journal.name
            }</textarea>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style=""><strong>Which Party</strong></div>
            ${
              listRadioButton ||
              `<div style=" font-style:italic;">No journals found</div>`
            }
          </div>
        </form>
      `,
          buttons: {
            save: {
              label: "Create",
              callback: async (html) => {
                const partyJournalName = html
                  .find("#heraldHud-partyJournalEditInput")
                  .val();
                const newType = html
                  .find("input[name='heraldHud-partyJournalEditType']:checked")
                  .val();

                journal.name = partyJournalName;
                journal.flags = journal.flags || {};
                journal.flags.type = newType;
                await game.journal.get(journal.id).update({
                  name: partyJournalName,
                  flags: { type: newType },
                });
                setTimeout(async () => {
                  await heraldHud_renderListPartyJournalMiddleContainer();
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
    });

    const deleteButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonDeletePartyJournalContainer"
    );

    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const journalId = button.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        if (!journal) return;

        new Dialog({
          title: "Delete Party Journal",
          content: `<p>Are you sure you want to delete the journal ?</p>`,
          buttons: {
            confirm: {
              label: "Delete",
              callback: async () => {
                await journal.delete();
                await heraldHud_renderListPartyJournalMiddleContainer();
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

export { heraldHud_renderListMenu };
