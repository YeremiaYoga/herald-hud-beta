import * as bc from "./backup.js";
import * as hl from "./helper.js";

let heraldHud_journalingSocket;
let heraldHud_questShow;

Hooks.once("socketlib.ready", () => {
  heraldHud_journalingSocket = socketlib.registerModule("herald-hud-beta");
  heraldHud_journalingSocket.register(
    "createPersonalNotesFolder",
    async (user) => {
      await heraldHud_gmCreatePersonalNotesFolder(user);
      await bc.heraldHud_createCompendiumPersonalNotesFolder(user);
    }
  );

  heraldHud_journalingSocket.register(
    "heraldHudCreatePersonalNotes",
    async (user, input, type) => {
      await heraldHud_createPersonalNotes(user, input, type);
    }
  );

  heraldHud_journalingSocket.register(
    "createPartyJournalFolder",
    async (user) => {
      await heraldHud_gmCreatePartyJournalFolder(user);
      await bc.heraldHud_createCompediumPartyJournalFolder();
    }
  );

  heraldHud_journalingSocket.register(
    "heraldHudCreatePartyJournal",
    async (user, input, type) => {
      await heraldHud_createPartyJournal(input, type);
    }
  );
  heraldHud_journalingSocket.register("updatePartyJournalAllUser", async () => {
    await heraldHud_renderListPartyJournalMiddleContainer();
  });
  heraldHud_journalingSocket.register(
    "backupHeralHudJournalByPage",
    async (user, journalEntry) => {
      const uuid = journalEntry.uuid;
      if (journalEntry.flags.category == "Personal Notes") {
        await bc.heraldHud_backupJournalPersonalNotes(user, journalEntry);
      } else if (journalEntry.flags.category == "Party Journal") {
        await bc.heraldHud_backupJournalPartyJournal(journalEntry);
      } else if (journalEntry.flags.category == "Npcs") {
        await bc.heraldHud_backupJournalNpcs(uuid);
      }
    }
  );
  heraldHud_journalingSocket.register("createQuestFolder", async () => {
    await gmCreateQuestFolder();
  });

  heraldHud_journalingSocket.register(
    "heraldHudCreateQuest",
    async (user, input, party, type, location) => {
      await heraldHud_createJournalQuest(user, input, party, type, location);
    }
  );

  heraldHud_journalingSocket.register("updateQuestAllUser", async () => {
    await heraldHud_renderListQuest();
  });

  heraldHud_journalingSocket.register("createNpcsFolder", async (user) => {
    await heraldHud_gmCreateNpcsFolder(user);
    await bc.heraldHud_createCompediumNpcsFolder();
  });

  heraldHud_journalingSocket.register("backupHeraldHudNpcs", async (uuid) => {
    await bc.heraldHud_backupJournalNpcs(uuid);
  });
});
async function heraldHud_renderListMenu() {
  let heraldHud_dialogDiv = document.getElementById("heraldHud-dialog");
  let arrMenu = [
    `biography`,
    `personal_notes`,
    `party_journal`,
    `quest`,
    `npcs`,
  ];
  let listMenu = ``;
  for (let menu of arrMenu) {
    let iconMenu = "";
    let menuTitle = menu
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    if (menu == "npcs") {
      iconMenu = `
      <div id="heraldHud-menuIconContainer" class="heraldHud-menuIconContainer" data-name="${menu}">
        <i class="fa-solid fa-crosshairs"></i>
      </div>
      `;
      menuTitle = "NPCs";
    }
    listMenu += `
        <div id="heraldHud-journalingItem" class="heraldHud-journalingItem" data-name="${menu}">
            <div class="heraldHud-journalingName">
                ${menuTitle}
            </div>
            ${iconMenu}
        </div>
        `;
  }
  if (heraldHud_dialogDiv) {
    heraldHud_dialogDiv.innerHTML = `
        <div class="heraldHud-journalingListItem">
            ${listMenu}
        </div> `;

    document
      .querySelectorAll(".heraldHud-journalingItem")
      .forEach((journaling) => {
        journaling.addEventListener("click", async function (event) {
          if (event.target.closest(".heraldHud-menuIconContainer")) return;
          let name = this.getAttribute("data-name");
          await heraldHud_showDialogSubMenuDetail(name);
        });
      });

    document
      .querySelectorAll(".heraldHud-menuIconContainer")
      .forEach((journaling) => {
        journaling.addEventListener("click", async function () {
          let name = this.getAttribute("data-name");
          if (name == "npcs") {
            await heraldHud_showDialogNpcsTarget();
          }
        });
      });
  }
}

async function heraldHud_showDialogSubMenuDetail(kategori) {
  const user = game.user;
  await heraldHud_showDialog2MenuDetail(kategori);
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");

  if (kategori == "biography") {
    await heraldHud_getViewBiography();
  } else if (kategori == `personal_notes`) {
    await heraldHud_getViewPersonalNotes();
  } else if (kategori == `party_journal`) {
    await heraldHud_getViewPartyJournal();
  } else if (kategori == `quest`) {
    await heraldHud_getViewQuest();
  } else if (kategori == `npcs`) {
    await heraldHud_getViewNpcs();
  } else if (kategori == `npcs_target`) {
    await heraldHud_getViewTargetingNpcs();
  }
}

async function heraldHud_showDialog2MenuDetail(kategori) {
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    if (heraldHud_dialog2Div.style.display == "none") {
      heraldHud_dialog2Div.style.display = "block";
      heraldHud_dialog2Div.style.border = `3px solid ${
        game.settings.get("herald-hud", "dialogBorderColor") || "#FFD700"
      }`;
      heraldHud_dialog2Div.style.boxShadow = `0 0 10px ${
        game.settings.get("herald-hud", "dialogBoxShadowColor") || "#CCAC00"
      }`;
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

  let biographyValue = selectedActor.system?.details?.biography.value || "";

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
  heraldHud_journalingSocket.executeAsGM("createPersonalNotesFolder", user);
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

              heraldHud_journalingSocket.executeAsGM(
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
  if (!playerFolder) {
    return ui.notifications.error("Player folder not found.");
  }
  const journalEntry = await JournalEntry.create({
    name: input,
    content: "",
    folder: playerFolder.id,
    flags: {
      type: type,
      category: "Personal Notes",
    },
    ownership: { default: 3 },
  });

  await bc.heraldHud_backupJournalPersonalNotes(user, journalEntry);
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
    let match = journalName.includes(valueSearch);

    if (!match && data.pages) {
      for (let page of data.pages.contents) {
        if (page.name.toLowerCase().includes(valueSearch)) {
          match = true;
          break;
        }
      }
    }

    if (match) {
      filteredPersonalNotes.push(data);
    }
  }
  let groupedNotes = {};
  let notesWithoutType = [];

  for (let journal of filteredPersonalNotes) {
    let journalName = journal.name;
    let type = journal.flags?.type || "";

    const sortedPages = journal.pages.contents.sort((a, b) => a.sort - b.sort);

    let pagesHTML = "";
    let pageNumber = 0;
    for (let page of sortedPages) {
      const level = page.title.level || 0;
      let marginLeft = 0;
      if (level === 1) marginLeft = 10;
      else if (level === 2) marginLeft = 20;
      else if (level === 3) marginLeft = 30;
      pageNumber++;
      pagesHTML += `
        <div class="heraldHud-personalNotesPageContainer" data-journal-id="${journal.id}" data-pageNumber="${pageNumber}" data-page-id="${page.id}" style="margin-left: ${marginLeft}px">
          <div class="heraldHud-personalNotesPage">
            <div class="heraldHud-personalNotesPageName">- ${page.name}</div>
          </div>  
          <div class="heraldHud-arrowPersonalNotesContainer">
           
            <div class="heraldHud-arrowPagePersonalNotes" data-id="${page.id}" data-pageNumber="${pageNumber}" data-journal-id="${journal.id}" data-type="up">
              <i class="fa fa-arrow-up" ></i>
            </div>
            <div class="heraldHud-arrowPagePersonalNotes" data-id="${page.id}" data-pageNumber="${pageNumber}" data-journal-id="${journal.id}" data-type="down">
                <i class="fa fa-arrow-down"></i>
            </div>
            <div class="heraldHud-deletePagePersonalNotes" data-pageId="${page.id}"  data-journalId="${journal.id}" style="color:red;">
              <i class="fa-solid fa-trash"></i>
            </div>
          </div>
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
            <div class="heraldHud-buttonAddPagePersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
              <i class="fa-solid fa-file-circle-plus"></i>
              <span class="heraldHud-btnPersonalNotesTooltip">Add Page</span>
            </div>
            <div class="heraldHud-buttonEditPersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
              <i class="fa-solid fa-pen-to-square"></i>
              <span class="heraldHud-btnPersonalNotesTooltip">Edit Journal</span>
            </div>
            <div class="heraldHud-buttonDeletePersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
              <i class="fa-solid fa-trash"></i>
              <span class="heraldHud-btnPersonalNotesTooltip">Delete Journal</span>
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
              <div class="heraldHud-buttonAddPagePersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-file-circle-plus"></i>
                <span class="heraldHud-btnPersonalNotesTooltip">Add Page</span>
              </div>
              <div class="heraldHud-buttonEditPersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-pen-to-square"></i>
                <span class="heraldHud-btnPersonalNotesTooltip">Edit Journal</span>
              </div>
              <div class="heraldHud-buttonDeletePersonalNotesContainer heraldHud-btnPersonalNotesTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-trash"></i>
                <span class="heraldHud-btnPersonalNotesTooltip">Delete Journal</span>
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

    const addPage = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonAddPagePersonalNotesContainer"
    );

    addPage.forEach((container) => {
      container.addEventListener("click", async (event) => {
        const journalId = container.getAttribute("data-id");
        await heraldHud_addPagePersonalNotes(journalId);
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
                const journalEntry = await game.journal.get(journal.id).update({
                  name: newName,
                  flags: { type: finalType },
                });
                await bc.heraldHud_backupJournalPersonalNotes(
                  user,
                  journalEntry
                );

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

    const pages = document.querySelectorAll(
      ".heraldHud-personalNotesPageContainer"
    );
    pages.forEach((pageEl) => {
      pageEl.addEventListener("click", async (event) => {
        if (event.target.closest(".heraldHud-arrowPersonalNotesContainer"))
          return;
        const journalId = pageEl.getAttribute("data-journal-id");
        const pageId = pageEl.getAttribute("data-page-id");

        const journal = game.journal.get(journalId);
        if (!journal) return;

        const page = journal.pages.get(pageId);
        if (!page) return;

        await page.sheet.render(true);
      });
    });

    const arrowUp = document.querySelectorAll(
      ".heraldHud-arrowPagePersonalNotes"
    );
    arrowUp.forEach((arrow) => {
      arrow.addEventListener("click", async () => {
        const type = arrow.getAttribute("data-type");
        const pageId = arrow.getAttribute("data-id");
        let pageNumber = parseInt(arrow.getAttribute("data-pageNumber"));
        const journalId = arrow.getAttribute("data-journal-id");

        if (type == "up") {
          await heraldHud_pageNumberChange("up", pageId, pageNumber, journalId);
        } else {
          await heraldHud_pageNumberChange(
            "down",
            pageId,
            pageNumber,
            journalId
          );
        }
      });
    });

    let deletePage = document.querySelectorAll(
      ".heraldHud-deletePagePersonalNotes"
    );
    deletePage.forEach((page) => {
      page.addEventListener("click", async function (event) {
        const journalId = event.currentTarget.getAttribute("data-journalId");
        const pageId = event.currentTarget.getAttribute("data-pageId");

        await heraldHud_deletePages("personal notes", journalId, pageId);
      });
    });
  }
}

async function heraldHud_pageNumberChange(type, pageId, pageNumber, journalId) {
  const journal = game.journal.get(journalId);
  if (!journal) {
    console.log("Journal tidak ditemukan");
    return;
  }
  const pages = journal.pages;
  const pageCount = pages.length;

  let pageChange = pageNumber;
  if (type == "up") {
    pageChange = pageNumber - 1;
  } else {
    pageChange = pageNumber + 1;
  }
  const before = document.querySelector(
    `.heraldHud-personalNotesPageContainer[data-pageNumber="${pageChange}"]`
  );
  if (!before) {
    return;
  }
  let previvousId = before.getAttribute("data-page-id");

  let previousPage = pages.find((page) => page.id === previvousId);

  let currentPage = pages.find((page) => page.id === pageId);

  let tempSort = currentPage.sort;
  currentPage.sort = previousPage.sort;
  previousPage.sort = tempSort;

  await journal.update({
    pages: [
      { _id: currentPage.id, sort: currentPage.sort },
      { _id: previousPage.id, sort: previousPage.sort },
    ],
  });

  await heraldHud_renderListPersonalNotesMiddleContainer();
}

async function heraldHud_addPagePersonalNotes(journalId) {
  const journal = game.journal.get(journalId);
  if (!journal) return;

  new Dialog({
    title: "Add New Page",
    content: `
      <form>
        <div class="form-group">
          <label for="page-name">Page Name</label>
          <input type="text" name="page-name" id="page-name" placeholder="Enter page name"/>
        </div>
      </form>
    `,
    buttons: {
      create: {
        label: "Save",
        callback: async (html) => {
          const pageName = html.find('[name="page-name"]').val();
          if (!pageName) return ui.notifications.warn("Page name is required.");

          const pages = journal.pages;
          const pageArray = [...pages.values()];
          const lastPage = pageArray[pageArray.length - 1];
          const lastPageSort = lastPage ? lastPage.sort : 0;

          await journal.createEmbeddedDocuments("JournalEntryPage", [
            {
              name: pageName,
              type: "text",
              text: { content: "" },
              sort: lastPageSort + 1,
            },
          ]);

          await heraldHud_renderListPersonalNotesMiddleContainer();
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "create",
  }).render(true);
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

/* ------------------------------------------------------------------------------
   DIALOG PARTY JOURNAL
------------------------------------------------------------------------------- */

async function heraldHud_gmCreatePartyJournalFolder(user) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldCoreFolder = "";
  let partyFolder = "";
  let heraldHudFolder = "";
  let partyJournalFolder = "";
  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      partyFolder = folder;
    }

    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (
      folder.name == "Party Journal" &&
      folder.folder.id == heraldHudFolder.id
    ) {
      partyJournalFolder = folder;
    }
  }
  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }

  if (!partyJournalFolder) {
    partyJournalFolder = await Folder.create({
      name: "Party Journal",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === partyFolder.id
  );
  for (let party of partyJournals) {
    let alreadyParty = false;
    for (let folder of folders) {
      if (
        folder.name == party.name &&
        folder.folder.id == partyJournalFolder.id
      ) {
        alreadyParty = true;
        break;
      }
    }
    if (!alreadyParty) {
      await Folder.create({
        name: party.name,
        type: "JournalEntry",
        folder: partyJournalFolder.id,
      });
    }
  }
}

async function heraldHud_createPartyJournal(input, type) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldHudFolder = "";
  let partyJournalFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (
      folder.name == "Party Journal" &&
      folder.folder.id == heraldHudFolder.id
    ) {
      partyJournalFolder = folder;
    }
  }
  const matchingFolder = folders.find(
    (folder) =>
      folder.name === type && folder.folder.id === partyJournalFolder.id
  );

  let journalEntry = await JournalEntry.create({
    name: input,
    content: "",
    folder: matchingFolder.id,
    flags: {
      type: type,
      category: "Party Journal",
    },
    ownership: { default: 3 },
  });
  await bc.heraldHud_backupJournalPartyJournal(journalEntry);
}

async function heraldHud_getViewPartyJournal() {
  const user = game.user;
  const selectedActor = user.character;
  heraldHud_journalingSocket.executeAsGM("createPartyJournalFolder", user);
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
          <div id="heraldHud-buttonAddPartyJournalContainer" class="heraldHud-buttonAddPartyJournalContainer">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>
    `;

    let searchPartyJournal = document.getElementById(
      "heraldHud-searchPartyJournal"
    );
    let inputSearchTimeOut;
    searchPartyJournal.addEventListener("input", () => {
      clearTimeout(inputSearchTimeOut);

      inputSearchTimeOut = setTimeout(async () => {
        await heraldHud_renderListPartyJournalMiddleContainer();
      }, 500);
    });
    let addPartyJournal = document.getElementById(
      "heraldHud-buttonAddPartyJournalContainer"
    );
    if (addPartyJournal) {
      addPartyJournal.addEventListener("click", async () => {
        const folders = game.folders.filter((f) => f.type === "JournalEntry");

        let heraldCoreFolder = "";
        let heraldCorePartyFolder = "";

        for (let folder of folders) {
          if (folder.name == "Herald Core") {
            heraldCoreFolder = folder;
          }

          if (
            folder.name == "Party" &&
            folder.folder.id == heraldCoreFolder.id
          ) {
            heraldCorePartyFolder = folder;
          }
        }

        const partyJournals = game.journal.filter(
          (j) => j.folder?.id === heraldCorePartyFolder.id
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

                heraldHud_journalingSocket.executeAsGM(
                  "heraldHudCreatePartyJournal",
                  user,
                  partyJournalName,
                  selectedJournalId
                );
                setTimeout(async () => {
                  heraldHud_journalingSocket.executeAsGM(
                    "updatePartyJournalAllUser"
                  );
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

  let arrUserPartyFolder = await hl.heraldHud_getPlayerPartyList(
    user,
    selectedActor,
    "folder"
  );

  let groupedPartyJournal = {};
  for (let partyFolder of arrUserPartyFolder) {
    let partyJournalList = game.journal.filter(
      (j) => j.folder?.id === partyFolder.id
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
      let match = journalName.includes(valueSearch);

      if (!match && data.pages) {
        for (let page of data.pages.contents) {
          if (page.name.toLowerCase().includes(valueSearch)) {
            match = true;
            break;
          }
        }
      }

      if (match) {
        filteredPartyJournal.push(data);
      }
    }

    for (let journal of filteredPartyJournal) {
      let journalName = journal.name;
      let type = journal.flags?.type || "";

      const sortedPages = journal.pages.contents.sort(
        (a, b) => a.sort - b.sort
      );
      let pagesHTML = "";
      let pageNumber = 0;
      for (let page of sortedPages) {
        const level = page.title.level || 0;
        let marginLeft = 0;
        if (level === 1) marginLeft = 10;
        else if (level === 2) marginLeft = 20;
        else if (level === 3) marginLeft = 30;
        pageNumber++;
        pagesHTML += `
          <div class="heraldHud-partyJournalPageContainer" data-journal-id="${journal.id}" data-pageNumber="${pageNumber}" data-page-id="${page.id}" style="margin-left: ${marginLeft}px" >
            <div class="heraldHud-partyJournalPage">
              <div class="heraldHud-partyJournalPageName">- ${page.name}</div>
            </div>
            <div class="heraldHud-arrowPartyJournalContainer">
              <div class="heraldHud-arrowPagePartyJournal" data-id="${page.id}" data-pageNumber="${pageNumber}" data-journal-id="${journal.id}" data-type="up">
                <i class="fa fa-arrow-up" ></i>
              </div>
              <div class="heraldHud-arrowPagePartyJournal" data-id="${page.id}" data-pageNumber="${pageNumber}" data-journal-id="${journal.id}" data-type="down">
                  <i class="fa fa-arrow-down"></i>
              </div>
              <div class="heraldHud-deletePagePartyJournal" data-pageId="${page.id}"  data-journalId="${journal.id}" style="color:red;">
                <i class="fa-solid fa-trash"></i>
              </div>
            </div>
          </div>
        `;
      }
      if (type) {
        if (!groupedPartyJournal[type]) {
          groupedPartyJournal[type] = "";
        }

        groupedPartyJournal[type] += `
        <div id="heraldHud-partyJournalWrapperContainer" class="heraldHud-partyJournalWrapperContainer">
          <div id="heraldHud-partyJournalContainer" class="heraldHud-partyJournalContainer" data-id="${journal.id}">
            <div id="heraldHud-partyJournalLeftContainer" class="heraldHud-partyJournalLeftContainer">
              <div id="heraldHud-partyJournalName" class="heraldHud-partyJournalName">${journalName}</div>
            </div>
            <div id="heraldHud-partyJournalMiddleContainer" class="heraldHud-partyJournalMiddleContainer">
            </div>
            <div id="heraldHud-partyJournalRightContainer" class="heraldHud-partyJournalRightContainer">
              <div id="heraldHud-buttonAddPagePartyJournalContainer" class="heraldHud-buttonAddPagePartyJournalContainer heraldHud-btnPartyJournalTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-file-circle-plus"></i>
                <span class="heraldHud-btnPartyJournalTooltip">Add Page</span>
              </div>
              <div id="heraldHud-buttonEditPartyJournalContainer" class="heraldHud-buttonEditPartyJournalContainer heraldHud-btnPartyJournalTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-pen-to-square"></i>
                <span class="heraldHud-btnPartyJournalTooltip">Edit Journal</span>
              </div>
              <div id="heraldHud-buttonDeletePartyJournalContainer" class="heraldHud-buttonDeletePartyJournalContainer heraldHud-btnPartyJournalTooltipParent" data-id="${journal.id}">
                <i class="fa-solid fa-trash"></i>
                <span class="heraldHud-btnPartyJournalTooltip">Delete Journal</span>
              </div>
            </div>
          </div>
          <div id="heraldHud-partyJournalPagesContainer" class="heraldHud-partyJournalPagesContainer">
            ${pagesHTML}
          </div>
        </div>
      `;
      }
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

  if (dialogMiddle) {
    dialogMiddle.innerHTML = listPartyJournal;

    const addPage = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonAddPagePartyJournalContainer"
    );

    addPage.forEach((container) => {
      container.addEventListener("click", async (event) => {
        const journalId = container.getAttribute("data-id");
        await heraldHud_addPagePartyJournal(journalId);
      });
    });

    const editButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-buttonEditPartyJournalContainer"
    );

    editButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const folders = game.folders.filter((f) => f.type === "JournalEntry");

        let heraldCoreFolder = "";
        let heraldCorePartyFolder = "";
        let heraldHudFolder = "";
        let partyJournalFolder = "";

        for (let folder of folders) {
          if (folder.name == "Herald Core") {
            heraldCoreFolder = folder;
          }

          if (
            folder.name == "Party" &&
            folder.folder.id == heraldCoreFolder.id
          ) {
            heraldCorePartyFolder = folder;
          }

          if (folder.name == "Herald Hud") {
            heraldHudFolder = folder;
          }

          if (
            folder.name == "Party Journal" &&
            folder.folder.id == heraldHudFolder.id
          ) {
            partyJournalFolder = folder;
          }
        }

        const partyJournals = game.journal.filter(
          (j) => j.folder?.id === heraldCorePartyFolder.id
        );
        let userUuid = user.uuid;
        let actorUuid = selectedActor.uuid;
        let listRadioButton = ``;
        const journalId = button.getAttribute("data-id");
        const journal = game.journal.get(journalId);
        for (let pj of partyJournals) {
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
        </form>`,
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
                let journalEntry = await game.journal.get(journal.id).update({
                  name: partyJournalName,
                  flags: { type: newType },
                });
                await bc.heraldHud_backupJournalPartyJournal(journalEntry);
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
    const pages = document.querySelectorAll(
      ".heraldHud-partyJournalPageContainer"
    );
    pages.forEach((pageEl) => {
      pageEl.addEventListener("click", async (event) => {
        if (event.target.closest(".heraldHud-arrowPartyJournalContainer"))
          return;
        const journalId = pageEl.getAttribute("data-journal-id");
        const pageId = pageEl.getAttribute("data-page-id");

        const journal = game.journal.get(journalId);
        if (!journal) return;

        const page = journal.pages.get(pageId);
        if (!page) return;

        await page.sheet.render(true);
      });
    });

    const arrowDiv = document.querySelectorAll(
      ".heraldHud-arrowPagePartyJournal"
    );
    arrowDiv.forEach((arrow) => {
      arrow.addEventListener("click", async () => {
        const type = arrow.getAttribute("data-type");
        const pageId = arrow.getAttribute("data-id");
        let pageNumber = parseInt(arrow.getAttribute("data-pageNumber"));
        const journalId = arrow.getAttribute("data-journal-id");

        if (type == "up") {
          await heraldHud_partyJournalPageNumberChange(
            "up",
            pageId,
            pageNumber,
            journalId
          );
        } else {
          await heraldHud_partyJournalPageNumberChange(
            "down",
            pageId,
            pageNumber,
            journalId
          );
        }
      });
    });

    let deletePage = document.querySelectorAll(
      ".heraldHud-deletePagePartyJournal"
    );
    deletePage.forEach((page) => {
      page.addEventListener("click", async function (event) {
        const journalId = event.currentTarget.getAttribute("data-journalId");
        const pageId = event.currentTarget.getAttribute("data-pageId");

        await heraldHud_deletePages("party journal", journalId, pageId);
      });
    });
  }
}

async function heraldHud_partyJournalPageNumberChange(
  type,
  pageId,
  pageNumber,
  journalId
) {
  const journal = game.journal.get(journalId);
  if (!journal) {
    console.log("Journal tidak ditemukan");
    return;
  }
  const pages = journal.pages;
  const pageCount = pages.length;

  let pageChange = pageNumber;
  if (type == "up") {
    pageChange = pageNumber - 1;
  } else {
    pageChange = pageNumber + 1;
  }
  const before = document.querySelector(
    `.heraldHud-partyJournalPageContainer[data-pageNumber="${pageChange}"]`
  );
  if (!before) {
    return;
  }
  let previvousId = before.getAttribute("data-page-id");

  let previousPage = pages.find((page) => page.id === previvousId);

  let currentPage = pages.find((page) => page.id === pageId);

  let tempSort = currentPage.sort;
  currentPage.sort = previousPage.sort;
  previousPage.sort = tempSort;

  await journal.update({
    pages: [
      { _id: currentPage.id, sort: currentPage.sort },
      { _id: previousPage.id, sort: previousPage.sort },
    ],
  });

  await heraldHud_renderListPartyJournalMiddleContainer();
}

async function heraldHud_addPagePartyJournal(journalId) {
  const journal = game.journal.get(journalId);
  if (!journal) return;

  new Dialog({
    title: "Add New Page",
    content: `
      <form>
        <div class="form-group">
          <label for="page-name">Page Name</label>
          <input type="text" name="page-name" id="page-name" placeholder="Enter page name"/>
        </div>
      </form>
    `,
    buttons: {
      create: {
        label: "Save",
        callback: async (html) => {
          const pageName = html.find('[name="page-name"]').val();
          if (!pageName) return ui.notifications.warn("Page name is required.");
          const pages = journal.pages;
          const pageArray = [...pages.values()];
          const lastPage = pageArray[pageArray.length - 1];
          const lastPageSort = lastPage ? lastPage.sort : 0;
          await journal.createEmbeddedDocuments("JournalEntryPage", [
            {
              name: pageName,
              type: "text",
              text: { content: "" },
              sort: lastPageSort + 1,
            },
          ]);

          await heraldHud_renderListPartyJournalMiddleContainer();
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "create",
  }).render(true);
}

/* ------------------------------------------------------------------------------
   DIALOG MISSION
------------------------------------------------------------------------------- */

async function gmCreateQuestFolder() {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldCoreFolder = "";
  let partyFolder = "";
  let heraldHudFolder = "";
  let questFolder = "";
  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      partyFolder = folder;
    }

    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (folder.name == "Quest" && folder.folder.id == heraldHudFolder.id) {
      questFolder = folder;
    }
  }
  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }
  if (!questFolder) {
    questFolder = await Folder.create({
      name: "Quest",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }
  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === partyFolder.id
  );
  for (let party of partyJournals) {
    let alreadyParty = false;
    for (let folder of folders) {
      if (folder.name == party.name && folder.folder?.id == questFolder.id) {
        alreadyParty = true;
        break;
      }
    }

    let createdFolder;
    if (!alreadyParty) {
      createdFolder = await Folder.create({
        name: party.name,
        type: "JournalEntry",
        folder: questFolder.id,
      });
    } else {
      createdFolder = folders.find(
        (f) => f.name === party.name && f.folder?.id === questFolder.id
      );
    }
    const subfolderNames = [
      "Main Quest",
      "Side Quest",
      "Players Quest",
      "Characters Quest",
    ];
    for (let name of subfolderNames) {
      const exists = game.folders.find(
        (f) =>
          f.name === name &&
          f.folder?.id === createdFolder.id &&
          f.type === "JournalEntry"
      );
      if (!exists) {
        await Folder.create({
          name,
          type: "JournalEntry",
          folder: createdFolder.id,
        });
      }
    }
  }
}

async function heraldHud_getViewQuest() {
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");
  heraldHud_journalingSocket.executeAsGM("createQuestFolder");
  const typeQuest = [
    {
      name: "Main Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/main_quest.png",
    },
    {
      name: "Side Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/side_quest.png",
    },
    {
      name: "Players Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/player_quest.png",
    },
    {
      name: "Characters Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/ch_quest.png",
    },
  ];
  let listTypeQuest = "";
  for (let quest of typeQuest) {
    listTypeQuest += `
    <div class="heraldHud-typeQuestContainer" data-name="${quest.name}">
       <img
            src="${quest.src}"
            alt="${quest.name}"
            class="heraldHud-typeQuestImage"
          />
    </div>
    `;
  }
  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
    <div id="heraldHud-dialogQuestContainer" class="heraldHud-dialogQuestContainer">
      <div id="heraldHud-questTopContiner" class="heraldHud-questTopContiner">
       
        ${listTypeQuest}
      </div>
      <div id="heraldHud-questMiddleContainer" class="heraldHud-questMiddleContainer">
        <div id="heraldHud-questMiddleLeftContainer" class="heraldHud-questMiddleLeftContainer"></div>
        <div id="heraldHud-questMiddleRightContainer" class="heraldHud-questMiddleRightContainer"></div>
      </div>
      <div id="heraldHud-questBottomContainer" class="heraldHud-questBottomContainer"></div>
    </div>
  `;

    document.querySelectorAll(".heraldHud-typeQuestContainer").forEach((el) => {
      el.addEventListener("click", async function () {
        const isActive = this.classList.contains("active");

        document
          .querySelectorAll(".heraldHud-typeQuestContainer")
          .forEach((el) => el.classList.remove("active"));

        if (!isActive) {
          this.classList.add("active");
        }
        await heraldHud_renderListQuest();
      });
    });
  }
  await heraldHud_renderQuestMiddleLeftContainer();
  await heraldHud_renderQuestMiddleRightContainer();
}

async function heraldHud_renderQuestMiddleLeftContainer() {
  const user = game.user;
  const selectedActor = user.character;
  let dialogMiddleLeft = document.getElementById(
    "heraldHud-questMiddleLeftContainer"
  );

  if (dialogMiddleLeft) {
    dialogMiddleLeft.innerHTML = `
      <div id="heraldHud-questListContainer" class="heraldHud-questListContainer">
        <div id="heraldHud-questListTopContainer" class="heraldHud-questListTopContainer"></div>
        <div id="heraldHud-questListMiddleContainer" class="heraldHud-questListMiddleContainer"></div>
        <div id="heraldHud-questListBottomContainer" class="heraldHud-questListBottomContainer">
          <div id="heraldHud-buttonAddQuest" class="heraldHud-buttonAddQuest">
            <i class="fa-solid fa-plus"></i>
          </div>
        </div>
      </div>
    `;

    let addQuest = document.getElementById("heraldHud-buttonAddQuest");
    if (addQuest) {
      addQuest.addEventListener("click", async () => {
        if (user.isGM) {
          await heraldHud_addQuestDM();
        } else {
          await heraldHud_addQuestPlayer();
        }
      });
    }
  }

  await heraldHud_renderListQuest();
}

async function heraldHud_renderListQuest() {
  const user = game.user;
  const selectedActor = user.character;
  let listQuestView = document.getElementById(
    "heraldHud-questListMiddleContainer"
  );
  let arrQuest = [
    "Main Quest",
    "Side Quest",
    "Players Quest",
    "Characters Quest",
  ];
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  const heraldCoreFolder = folders.find((f) => f.name === "Herald Core");
  const heraldCorePartyFolder = folders.find(
    (f) => f.name === "Party" && f.folder?.id === heraldCoreFolder?.id
  );
  const heraldHudFolder = folders.find((f) => f.name === "Herald Hud");
  const questFolder = folders.find(
    (f) => f.name === "Quest" && f.folder?.id === heraldHudFolder?.id
  );

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder?.id
  );

  const userUuid = game.user.uuid;
  const actorUuid = game.user.character?.uuid;
  let listParty = [];

  if (user.isGM) {
    listParty = partyJournals;
  } else {
    for (const journal of partyJournals) {
      const match = journal.pages.find(
        (page) => page.name === `${userUuid} | ${actorUuid}`
      );
      if (match) listParty.push(journal);
    }
  }

  let allQuestJournals = [];
  for (let party of listParty) {
    const partyFolder = folders.find(
      (folder) =>
        folder.name === party.name && folder.folder?.id === questFolder?.id
    );
    if (!partyFolder) continue;

    for (let type of arrQuest) {
      const typeFolder = folders.find(
        (folder) => folder.name === type && folder.folder?.id === partyFolder.id
      );
      if (!typeFolder) continue;

      const typeJournals = game.journal.filter(
        (j) => j.folder?.id === typeFolder.id
      );

      allQuestJournals.push(...typeJournals);
    }
  }

  const typeQuest = [
    {
      name: "Main Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/main_quest.png",
    },
    {
      name: "Side Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/side_quest.png",
    },
    {
      name: "Players Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/player_quest.png",
    },
    {
      name: "Characters Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/ch_quest.png",
    },
  ];
  let listQuest = ``;
  const activeTypeEl = document.querySelector(
    ".heraldHud-typeQuestContainer.active"
  );
  for (let quest of allQuestJournals) {
    if (activeTypeEl && quest.flags.type !== activeTypeEl.dataset.name)
      continue;
    let visibleButton = ``;
    if (user.isGM) {
      const isVisible = quest.flags.visible === true;
      const iconColor = isVisible ? "white" : "gray";

      visibleButton = `
    <div class="heraldHud-visibleButton" data-id="${quest.id}" data-visible="${isVisible}">
      <i class="fa-solid fa-eye" style="color: ${iconColor};"></i>
    </div>`;
    } else {
      if (quest.flags.visible == false) {
        continue;
      }
    }
    const matchType = typeQuest.find((t) => t.name === quest.flags.type);
    let src = matchType ? matchType.src : "";

    let page3 = "";
    const pagesArray = quest.pages.contents;
    if (pagesArray.length >= 3) {
      if (pagesArray[2]) {
        page3 = pagesArray[2].name;
      }
    }

    listQuest += `
    <div class="heraldHud-questItemContainer" data-id="${quest.id}">
      <div class="heraldHud-questItemLeftContainer">
      <div class="heraldHud-questItemTypeContainer">
         <img
            src="${src}"
            alt="${quest.flags.type}"
            class="heraldHud-questItemTypeImage"
          />
      
      </div>
      </div>
      <div class="heraldHud-questItemMiddleContainer">
        <div class="heraldHud-listQuestName">${quest.name}</div>
        <div class="heraldHud-questNameParty">${page3}</div>
      </div>
      <div class="heraldHud-questItemRightContainer">
        ${visibleButton}
      </div>
    </div>
    `;
  }

  if (listQuestView) {
    listQuestView.innerHTML = listQuest;

    const visible = listQuestView.querySelectorAll(".heraldHud-visibleButton");
    visible.forEach((vsb) => {
      vsb.addEventListener("click", async () => {
        const questId = vsb.getAttribute("data-id");
        const currentVisible = vsb.getAttribute("data-visible") === "true";

        const journal = game.journal.get(questId);
        if (!journal) return;

        const newVisible = !currentVisible;

        await journal.update({
          "flags.visible": newVisible,
        });
        vsb.setAttribute("data-visible", newVisible);
        const icon = vsb.querySelector("i");
        icon.style.color = newVisible ? "white" : "gray";

        heraldHud_journalingSocket.executeForEveryone(
          "updateQuestAllUser"
        );
      });
    });

    const questItem = listQuestView.querySelectorAll(
      ".heraldHud-questItemContainer"
    );
    questItem.forEach((item) => {
      item.addEventListener("click", async (event) => {
        if (event.target.closest(".heraldHud-visibleButton")) return;

        const questId = item.getAttribute("data-id");
        heraldHud_questShow = questId;
        await heraldHud_renderQuestPage();
      });
    });
  }
}

async function heraldHud_addQuestPlayer() {
  const user = game.user;
  const selectedActor = user.character;

  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldCoreFolder = "";
  let heraldCorePartyFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      heraldCorePartyFolder = folder;
    }
  }

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder.id
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
              id="heraldHud-questParty-${journal.id}"
              name="heraldHud-questParty"
              value="${journal.name}"
         
            />
            <label
              for="heraldHud-questParty-${journal.id}"
              style=""
            >${journal.name}</label>
          </div>
        `;
      }
    }
  }
  const dialog = new Dialog({
    title: "Herald HUD - Add Quest",
    content: `
    <form>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
        <label for="heraldHud-questNameInput"><strong>Quest Name</strong></label>
        <textarea id="heraldHud-questNameInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div><strong> Party</strong></div>
        ${
          listRadioButton ||
          `<div style=" font-style:italic;">No journals found</div>`
        }
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
        <label>Location:</label>
        <div style="display: flex; gap: 5px; align-items: center;">
          <input type="text" id="heraldHud-questLocationInput" style="flex: 1;" />
          <div class="heraldHud-questLocationUnknownBtn" style="padding:4px 9px;border-radius: 4px;cursor: pointer;border: 1px solid rgba(100, 100, 100, 0.8);">?</div>
        </div>
      </div>
    </form>
  `,
    buttons: {},
    render: async (html) => {
      const confirmButton = $(
        `<button type="button" class="dialog-button">Create</button>`
      );
      const cancelButton = $(
        `<button type="button" class="dialog-button">Cancel</button>`
      );

      html
        .closest(".app")
        .find(".dialog-buttons")
        .append(confirmButton, cancelButton);

      html.find(".heraldHud-questLocationUnknownBtn").on("click", function () {
        const input = html.find("#heraldHud-questLocationInput");
        const isActive = $(this).hasClass("selected");
        if (isActive) {
          $(this).removeClass("selected").css({
            backgroundColor: "",
            color: "",
          });
          input.prop("disabled", false).val("");
        } else {
          $(this).addClass("selected").css({
            backgroundColor: "rgba(100, 100, 100, 0.8)",
            color: "#fff",
          });
          input.prop("disabled", true).val("Unknown");
        }
      });

      confirmButton.on("click", async () => {
        const questName = html.find("#heraldHud-questNameInput").val()?.trim();
        const questParty = html
          .find("input[name='heraldHud-questParty']:checked")
          .val();
        const location = html
          .find("#heraldHud-questLocationInput")
          .val()
          ?.trim();
        let missingFields = [];
        if (!questName) missingFields.push("Quest Name");
        if (!questParty) missingFields.push("Party");
        if (!location) missingFields.push("Location");

        if (missingFields.length > 0) {
          ui.notifications.error(
            `Please fill out: ${missingFields.join(", ")}`
          );
          return;
        }

        heraldHud_journalingSocket.executeAsGM(
          "heraldHudCreateQuest",
          user,
          questName,
          [questParty],
          "Players Quest",
          location
        );
        dialog.close();
        setTimeout(async () => {
          await heraldHud_renderListQuest();
        }, 500);
      });

      cancelButton.on("click", () => dialog.close());
    },
    default: "",
  });

  dialog.render(true);
}
async function heraldHud_addQuestDM() {
  const user = game.user;
  const selectedActor = user.character;
  let arrQuest = [
    "Main Quest",
    "Side Quest",
    "Players Quest",
    "Characters Quest",
  ];

  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldCoreFolder = "";
  let heraldCorePartyFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      heraldCorePartyFolder = folder;
    }
  }

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder.id
  );

  let listRadioButton = ``;
  for (let quest of arrQuest) {
    listRadioButton += `
          <div style="margin-bottom:4px;">
            <input
              type="radio"
              id="heraldHud-radioQuestType-${quest}"
              name="heraldHud-radioQuestType"
              value="${quest}"
         
            />
            <label
              for="heraldHud-radioQuestType-${quest}"
              style=""
            >${quest}</label>
          </div>
        `;
  }
  let listCheckbox = ``;
  for (let journal of partyJournals) {
    listCheckbox += `
    <div >
      <label 
        for="heraldHud-checkboxQuestParty-${journal.id}" 
        style="display: flex; align-items: center; cursor: pointer;"
      >
        <input
          type="checkbox"
          id="heraldHud-checkboxQuestParty-${journal.id}"
          name="heraldHud-checkboxQuestParty"
          value="${journal.name}"
          style="margin-right: 8px;"
        />
        ${journal.name}
      </label>
    </div>
  `;
  }

  const dialog = new Dialog({
    title: "Herald HUD - Add Quest",
    content: `
    <form>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
        <label for="heraldHud-questNameInput"><strong>Quest Name</strong></label>
        <textarea id="heraldHud-questNameInput" rows="3" style="width: 100%;" placeholder="Enter Name ..."></textarea>
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div><strong>Quest Type</strong></div>
        ${
          listRadioButton ||
          `<div style=" font-style:italic;">No journals found</div>`
        }
      </div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div><strong>Party That Can See</strong></div>
        ${
          listCheckbox ||
          `<div style=" font-style:italic;">No journals found</div>`
        }
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom:10px;">
        <label>Location:</label>
        <div style="display: flex; gap: 5px; align-items: center;">
          <input type="text" id="heraldHud-questLocationInput" style="flex: 1;" />
          <div class="heraldHud-questLocationUnknownBtn" style="padding:4px 9px;border-radius: 4px;cursor: pointer;border: 1px solid rgba(100, 100, 100, 0.8);">?</div>
        </div>
      </div>
    </form>
  `,
    buttons: {},
    render: (html) => {
      const confirmButton = $(
        `<button type="button" class="dialog-button">Create</button>`
      );
      const cancelButton = $(
        `<button type="button" class="dialog-button">Cancel</button>`
      );
      html
        .closest(".app")
        .find(".dialog-buttons")
        .append(confirmButton, cancelButton);

      html.find(".heraldHud-questLocationUnknownBtn").on("click", function () {
        const input = html.find("#heraldHud-questLocationInput");
        const isActive = $(this).hasClass("selected");
        if (isActive) {
          $(this).removeClass("selected").css({
            backgroundColor: "",
            color: "",
          });
          input.prop("disabled", false).val("");
        } else {
          $(this).addClass("selected").css({
            backgroundColor: "rgba(100, 100, 100, 0.8)",
            color: "#fff",
          });
          input.prop("disabled", true).val("Unknown");
        }
      });

      confirmButton.on("click", async () => {
        const questName = html.find("#heraldHud-questNameInput").val()?.trim();
        const questType = html
          .find("input[name='heraldHud-radioQuestType']:checked")
          .val();
        const questParties = [];
        html
          .find("input[name='heraldHud-checkboxQuestParty']:checked")
          .each(function () {
            questParties.push(this.value);
          });
        const location = html
          .find("#heraldHud-questLocationInput")
          .val()
          ?.trim();
        console.log(location);
        let missingFields = [];
        if (!questName) missingFields.push("Quest Name");
        if (!questType) missingFields.push("Quest Type");
        if (questParties.length === 0) missingFields.push("Party That Can See");
        if (!location) missingFields.push("Location");

        if (missingFields.length > 0) {
          ui.notifications.error(
            `Please fill out: ${missingFields.join(", ")}`
          );
          return;
        }

        await heraldHud_createJournalQuest(
          user,
          questName,
          questParties,
          questType,
          location
        );

        dialog.close();
        setTimeout(async () => {
          await heraldHud_renderListQuest();
        }, 500);
      });

      cancelButton.on("click", () => dialog.close());
    },
    default: "",
  });

  dialog.render(true);
}

async function heraldHud_createJournalQuest(
  user,
  input,
  arrParty,
  type,
  location
) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldHudFolder = "";
  let questFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (folder.name == "Quest" && folder.folder.id == heraldHudFolder.id) {
      questFolder = folder;
    }
  }

  for (let party of arrParty) {
    const partyFolder = folders.find(
      (folder) => folder.name === party && folder.folder.id === questFolder.id
    );
    const typeFolder = folders.find(
      (folder) => folder.name === type && folder.folder.id === partyFolder.id
    );
    let journalEntry = await JournalEntry.create({
      name: input,
      content: "",
      folder: typeFolder.id,
      flags: {
        visible: true,
        party: party,
        type: type,
        user: user.uuid,
        category: "Quest",
      },
      ownership: { default: 3 },
      pages: [
        {
          name: "DM Information",
          type: "text",
          text: {
            content: "",
            format: 1,
          },
        },
        {
          name: "Player Information",
          type: "text",
          text: {
            content: "",
            format: 1,
          },
        },
        {
          name: location,
          type: "text",
          text: {
            content: "On Going",
            format: 1,
          },
        },
      ],
    });
  }
}

async function heraldHud_renderQuestMiddleRightContainer() {
  const user = game.user;
  const selectedActor = user.character;
  let dialogMiddleRight = document.getElementById(
    "heraldHud-questMiddleRightContainer"
  );

  if (dialogMiddleRight) {
    dialogMiddleRight.innerHTML = `
    <div id="heraldHud-questDetailContainer" class="heraldHud-questDetailContainer">
    </div>
 `;
  }
  await heraldHud_renderQuestPage();
}

async function heraldHud_renderQuestPage() {
  const user = game.user;
  const selectedActor = user.character;
  if (!heraldHud_questShow) {
    return;
  }
  const typeQuest = [
    {
      name: "Main Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/main_quest.png",
    },
    {
      name: "Side Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/side_quest.png",
    },
    {
      name: "Players Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/player_quest.png",
    },
    {
      name: "Characters Quest",
      src: "/modules/herald-hud-beta/assets/quest-icon/ch_quest.png",
    },
  ];
  let questDetail = document.getElementById("heraldHud-questDetailContainer");
  const journal = game.journal.get(heraldHud_questShow);
  const pages = journal.pages.contents.slice(0, 3);
  const [page1, page2, page3] = pages;

  const matchType = typeQuest.find((t) => t.name === journal.flags.type);
  let src = matchType ? matchType.src : "";

  let pageDetail = "";
  let numberPage = 0;
  const progressName = new DOMParser().parseFromString(
    page3.text.content,
    "text/html"
  ).body.textContent;

  let editPageDM = ``;
  let editPagePlayer = ``;

  if (user.isGM) {
    editPageDM = `<div class="heraldHud-editQuestPageContent" data-pageId="${page1.id}"><i class="fa-solid fa-gopuram" style="font-size:20px;"></i></div>`;
  }
  editPagePlayer = `<div class="heraldHud-editQuestPageContent" data-pageId="${page2.id}"><i class="fa-solid fa-gopuram" style="font-size:20px;"></i></div>`;

  const pagesToRender = [page1, page2];

  for (let i = 0; i < pagesToRender.length; i++) {
    const page = pagesToRender[i];
    if (!page.text.content) continue;

    numberPage++;

    const editIcon = i === 0 ? editPageDM : editPagePlayer;

    pageDetail += `
    <div class="heraldHud-questPageContainer">
  
      <div>${page.text.content}</div>
      <div >
        ${editIcon}
      </div>
      
      <div style="flex: 1; height: 2px; background-color: #aaa;"></div>
    </div>`;
  }
  if (questDetail) {
    questDetail.innerHTML = `
    <div class="heraldHud-questDetailItem">
      <div class="heraldHud-questDetailTopContainer">
        <div id="heraldHud-questTitle"  class="heraldHud-questTitle">${journal.name}</div>
        <div>  
          <img
            src="${src}"
            alt="${journal.flags.type}"
            class="heraldHud-questDetailType"
          /></div>
      </div>
      <div class="heraldHud-questHeaderContainer">
        <div style="width: 20px; height: 2px; background-color: #aaa;"></div>
        <div id="heraldHud-questHeaderName" class="heraldHud-questHeaderName">${page3.name} / ${progressName}</div>
        <div style="flex: 1; height: 2px; background-color: #aaa;"></div>
      </div>
      <div class="heraldHud-questPageListContainer">
        ${pageDetail}
      </div>
    </div>`;

    if (user.isGM || journal.flags.type == "Players Quest") {
      document
        .getElementById("heraldHud-questTitle")
        ?.addEventListener("click", async () => {
          const content = `
      <form>
        <div class="form-group">
          <label>Quest Name</label>
          <input type="text" name="heraldHud-editQuestName" value="${journal.name}"/>
        </div>
        <div class="form-group">
          <label>Progress :</label>
          <input type="text" name="heraldHud-editQuestProgress" value="${progressName}"/>
        </div>
      </form>
    `;
          new Dialog({
            title: "Edit Quest Info",
            content: content,
            buttons: {
              save: {
                label: "Save",
                callback: async (html) => {
                  const title = html
                    .find("[name='heraldHud-editQuestName']")
                    .val();
                  const textContent = html
                    .find("[name='heraldHud-editQuestProgress']")
                    .val();

                  await journal.update({ name: title });
                  await page3.update({
                    "text.content": `<p>${textContent}</p>`,
                    "text.format": 1,
                  });

                  await heraldHud_renderQuestPage();
                  await heraldHud_renderListQuest();
                },
              },
              cancel: {
                label: "Cancel",
              },
            },
            default: "save",
          }).render(true);
        });

      document
        .getElementById("heraldHud-questHeaderName")
        ?.addEventListener("click", async () => {
          const content = `
      <form>
        <div class="form-group">
          <label>Location Name</label>
          <input type="text" name="heraldHud-editLocationName" value="${page3.name}"/>
        </div>
      </form>
    `;
          new Dialog({
            title: "Edit Location Name",
            content: content,
            buttons: {
              save: {
                label: "Save",
                callback: async (html) => {
                  const locationName = html
                    .find("[name='heraldHud-editLocationName']")
                    .val();
                  await page3.update({ name: locationName });

                  await heraldHud_renderQuestPage();
                  await heraldHud_renderListQuest();
                },
              },
              cancel: {
                label: "Cancel",
              },
            },
            default: "save",
          }).render(true);
        });
    }
    document
      .querySelectorAll(".heraldHud-editQuestPageContent")
      .forEach((el) => {
        el.addEventListener("click", async (e) => {
          const pageId = e.currentTarget.dataset.pageid;
          const page = game.journal.get(heraldHud_questShow).pages.get(pageId);

          if (page) {
            page.sheet.render(true);
          } else {
            ui.notifications.warn("Page not found.");
          }
        });
      });
  }
}

/* ------------------------------------------------------------------------------
   DIALOG NPCS TARGET
------------------------------------------------------------------------------- */

async function heraldHud_gmCreateNpcsFolder(user) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldCoreFolder = "";
  let partyFolder = "";
  let heraldHudFolder = "";
  let npcsFolder = "";
  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      partyFolder = folder;
    }

    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }

    if (folder.name == "Npcs" && folder.folder.id == heraldHudFolder.id) {
      npcsFolder = folder;
    }
  }
  if (!heraldHudFolder) {
    heraldHudFolder = await Folder.create({
      name: "Herald Hud",
      type: "JournalEntry",
    });
  }
  if (!npcsFolder) {
    npcsFolder = await Folder.create({
      name: "Npcs",
      type: "JournalEntry",
      folder: heraldHudFolder.id,
    });
  }
  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === partyFolder.id
  );
  for (let party of partyJournals) {
    let alreadyParty = false;
    for (let folder of folders) {
      if (folder.name == party.name && folder.folder.id == npcsFolder.id) {
        alreadyParty = true;
        break;
      }
    }
    if (!alreadyParty) {
      const createdFolder = await Folder.create({
        name: party.name,
        type: "JournalEntry",
        folder: npcsFolder.id,
      });

      await JournalEntry.create({
        name: `${party.name} NPCs`,
        folder: createdFolder.id,
        pages: [],
        content: "",
        flags: {
          category: "Npcs",
        },
        ownership: { default: 3 },
      });
    }
  }
}

// 0 = Neutral
// 1 = Friendly
// -1 = Hostile
// -2 = Secret
let arrNpcdisposition = [0, 1, -1, -2];
async function heraldHud_showDialogNpcsTarget() {
  const user = game.user;
  const selectedActor = user.character;
  const controlledToken = canvas.tokens.controlled[0] || null;
  const targetedToken = game.user.targets.first() || null;
  if (!controlledToken) {
    ui.notifications.warn("No NPC target selected.");
    return;
  }
  if (!targetedToken) {
    ui.notifications.warn("No NPC target selected.");
    return;
  }

  const tokenDocument = targetedToken.document;

  if (!arrNpcdisposition.includes(tokenDocument.disposition)) {
    ui.notifications.warn("Npc Not Available");
    return;
  }

  heraldHud_journalingSocket.executeAsGM("createNpcsFolder", user);

  const actor = tokenDocument.actor;
  const image = tokenDocument.texture?.src || actor.img;
  const name = tokenDocument.name || actor.name;

  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldCoreFolder = "";
  let heraldCorePartyFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
      heraldCorePartyFolder = folder;
    }
  }

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder.id
  );
  let userUuid = user.uuid;
  let actorUuid = selectedActor.uuid;
  let listRadioButton = ``;

  for (let pj of partyJournals) {
    for (let page of pj.pages) {
      if (page.name === `${userUuid} | ${actorUuid}`) {
        listRadioButton += `
    <div style="margin-bottom:4px;">
      <input
        type="radio"
        id="heraldHud-npcsPartyInput-${pj.id}"
        name="heraldHud-npcsPartyInput" 
        value="${pj.name}"
      />
      <label
        for="heraldHud-npcsPartyInput-${pj.id}"
        style=""
      >${pj.name}</label>
    </div>
  `;
      }
    }
  }

  let dialogContent = `
  <div id="heraldHud-dialogNpcsTargetContainer" class="heraldHud-dialogNpcsTargetContainer" style="display: flex; flex-direction: column; gap: 10px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 70px; height: 70px; border-radius: 50%; overflow: hidden; display: flex; justify-content: center; align-items: center; border:1px solid black">
        <img src="${image}" alt="Token Image" style="width: 100%; height: 100%; object-fit: cover; border:none">
      </div>
      <div>
          <div style="font-weight: bold; font-size: 20px;">Name :</div>
          <div style=" font-size: 14px;">${name}</div>
      </div>
    
    </div>

    <div>
      <label>Gender:</label>
      <div class="heraldHud-npcsGenderSelector" style="display: flex; gap: 5px;">
  ${["Male", "Female", "Other", "They"]
    .map((gender) => {
      let icon = "";
      let color = "";

      if (gender === "Male") {
        icon = '<i class="fa-solid fa-mars" style="color:rgb(32, 0, 212)"></i>';
        color = "rgb(32, 0, 212)";
      } else if (gender === "Female") {
        icon =
          '<i class="fa-solid fa-venus" style="color:rgb(216, 0, 198)"></i>';
        color = "rgb(216, 0, 198)";
      } else if (gender === "Other") {
        icon =
          '<i class="fa-solid fa-question" style="color:rgb(0, 0, 0)"></i>';
        color = "rgb(0, 0, 0)";
      } else if (gender === "They") {
        icon =
          '<i class="fa-solid fa-mars-and-venus" style="color:rgb(121, 0, 235)"></i>';
        color = "rgb(121, 0, 235)";
      }
      return `
          <div class="heraldHud-npcsGenderOption" data-gender="${gender}" style="
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            border: 1px solid rgba(100, 100, 100, 0.8);
            font-size:20px;
       
          ">
            ${icon}
          </div>
        `;
    })
    .join("")}
</div>

    </div>

    <div>
      <label>Faction:</label>
      <div style="display: flex; gap: 5px; align-items: center;">
        <input type="text" id="heraldHud-npcsFactionInput" style="flex: 1;" />
        <div class="heraldHud-npcsFactionUnknownBtn" style="padding:4px 9px;border-radius: 4px;cursor: pointer;border: 1px solid rgba(100, 100, 100, 0.8);">?</div>
      </div>
    </div>

    <div>
      <label>Race:</label>
      <div style="display: flex; gap: 5px; align-items: center;">
        <input type="text" id="heraldHud-npcsRaceInput" style="flex: 1;" />
        <div class="heraldHud-npcsRaceUnknownBtn" style="padding:4px 9px;border-radius: 4px;cursor: pointer;border: 1px solid rgba(100, 100, 100, 0.8);">?</div>
      </div>
    </div>

    <div>
      <label>Party:</label>
      <div>
        ${listRadioButton}
      </div>
    </div>
  </div>
`;
  const dialog = new Dialog({
    title: `NPC Target Info - ${name}`,
    content: dialogContent,
    buttons: {},
    render: (html) => {
      const confirmButton = $(
        `<button type="button" class="dialog-button">Confirm</button>`
      );
      const cancelButton = $(
        `<button type="button" class="dialog-button">Cancel</button>`
      );
      html
        .closest(".app")
        .find(".dialog-buttons")
        .append(confirmButton, cancelButton);

      confirmButton.on("click", async () => {
        const selectedGender = html
          .find(".heraldHud-npcsGenderOption.selected")
          .data("gender");
        const faction = html
          .find("#heraldHud-npcsFactionUnknown")
          .prop("checked")
          ? "Unknown"
          : html.find("#heraldHud-npcsFactionInput").val()?.trim();
        const race = html.find("#heraldHud-npcsRaceUnknown").prop("checked")
          ? "Unknown"
          : html.find("#heraldHud-npcsRaceInput").val()?.trim();
        const party = html
          .find('input[name="heraldHud-npcsPartyInput"]:checked')
          .val();

        let missingFields = [];

        if (!selectedGender) missingFields.push("Gender");
        if (!faction) missingFields.push("Faction");
        if (!race) missingFields.push("Race");
        if (!party) missingFields.push("Party");

        if (missingFields.length > 0) {
          const message = `Please fill out the following field(s): ${missingFields.join(
            ", "
          )}`;
          ui.notifications.error(message);
          return;
        }

        let data = {
          actor: actor,
          gender: selectedGender,
          faction: faction,
          race: race,
          party: party,
        };
        await heraldHud_confirmAddNpcsTarget(data);
        dialog.close();
      });

      cancelButton.on("click", () => dialog.close());

      html.find(".heraldHud-npcsGenderOption").on("click", function () {
        html.find(".heraldHud-npcsGenderOption").removeClass("selected").css({
          backgroundColor: "",
          color: "",
        });
        $(this)
          .addClass("selected")
          .css("background-color", "rgba(100, 100, 100, 0.8)")
          .css("color", "#fff");
      });

      html.find(".heraldHud-npcsFactionUnknownBtn").on("click", function () {
        const input = html.find("#heraldHud-npcsFactionInput");
        const isActive = $(this).hasClass("selected");
        if (isActive) {
          $(this).removeClass("selected").css({
            backgroundColor: "",
            color: "",
          });
          input.prop("disabled", false).val("");
        } else {
          $(this).addClass("selected").css({
            backgroundColor: "rgba(100, 100, 100, 0.8)",
            color: "#fff",
          });
          input.prop("disabled", true).val("Unknown");
        }
      });

      html.find(".heraldHud-npcsRaceUnknownBtn").on("click", function () {
        const input = html.find("#heraldHud-npcsRaceInput");
        const isActive = $(this).hasClass("selected");
        if (isActive) {
          $(this).removeClass("selected").css({
            backgroundColor: "",
            color: "",
          });
          input.prop("disabled", false).val("");
        } else {
          $(this).addClass("selected").css({
            backgroundColor: "rgba(100, 100, 100, 0.8)",
            color: "#fff",
          });
          input.prop("disabled", true).val("Unknown");
        }
      });
    },
    default: "",
  });

  dialog.render(true);
}

async function heraldHud_confirmAddNpcsTarget(data) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");
  const heraldHudFolder = folders.find((f) => f.name === "Herald Hud");
  const npcsFolder = folders.find(
    (f) => f.name === "Npcs" && f.folder?.id === heraldHudFolder?.id
  );
  const partyFolder = folders.find(
    (f) => f.name === data.party && f.folder?.id === npcsFolder?.id
  );

  const partyJournal = game.journal.find(
    (j) => j.folder?.id === partyFolder?.id && j.name === `${data.party} NPCs`
  );
  const pageData = {
    name: data.actor.name || "Unnamed NPC",
    type: "text",
    text: {
      content: `
        <img src="${data.actor.img}" width="100" height="100">
        <p><strong>Name :</strong> ${data.actor.name}</p>
        <p><strong>Gender :</strong> ${data.gender}</p>
        <p><strong>Faction :</strong> ${data.faction}</p>
        <p><strong>Race : </strong>${data.race}</p>
        <p><strong>Public Notes :</strong></p>
        ${data.actor.system.details.biography.public}
        <p><strong>Extra Notes :</strong> </p>
        <p></p>
      `,
      format: 1,
    },
  };

  if (partyJournal) {
    const existingPage = partyJournal.pages.find(
      (p) => p.name === pageData.name
    );
    if (existingPage) {
      new Dialog({
        title: "Yes ",
        content: `<p>The Character Might Already Exist, do you wish to Continue?</p>`,
        buttons: {
          yes: {
            label: "Yes",
            callback: async () => {
              await existingPage.delete();
              const createdPages = await partyJournal.createEmbeddedDocuments(
                "JournalEntryPage",
                [pageData]
              );
            },
          },
          no: {
            label: "No",
            callback: () => {},
          },
        },
        default: "no",
      }).render(true);
    } else {
      await partyJournal.createEmbeddedDocuments("JournalEntryPage", [
        pageData,
      ]);
    }

    const uuid = partyJournal.uuid;
    await heraldHud_journalingSocket.executeAsGM("backupHeraldHudNpcs", uuid);
  }
}

/* ------------------------------------------------------------------------------
   DIALOG NPCS 
------------------------------------------------------------------------------- */

async function heraldHud_getViewNpcs() {
  const user = game.user;
  const selectedActor = user.character;
  let heraldHud_dialog2Div = document.getElementById("heraldHud-dialog2");

  if (heraldHud_dialog2Div) {
    heraldHud_dialog2Div.innerHTML = `
      <div id="heraldHud-dialogNpcsContainer" class="heraldHud-dialogNpcsContainer">
        <div id="heraldHud-npcsTopContiner" class="heraldHud-npcsTopContiner"></div>
        <div id="heraldHud-npcsMiddleContainer" class="heraldHud-npcsMiddleContainer"></div>
        <div id="heraldHud-npcsBottomContainer" class="heraldHud-npcsBottomContainer">
          <div class="heraldHud-searchNpcsContainer" >
            <input type="text" id="heraldHud-searchNpcs" class="heraldHud-searchNpcs" placeholder="Search notes..." />
          </div>
        </div>
      </div>
    `;
  }

  let searchNpcs = document.getElementById("heraldHud-searchNpcs");
  let inputSearchTimeOut;
  searchNpcs.addEventListener("input", () => {
    clearTimeout(inputSearchTimeOut);

    inputSearchTimeOut = setTimeout(async () => {
      await heraldHud_renderNpcsMiddleContainer();
    }, 500);
  });
  await heraldHud_renderNpcsMiddleContainer();
}

async function heraldHud_renderNpcsMiddleContainer() {
  const user = game.user;
  const selectedActor = user.character;
  let dialogMiddle = document.getElementById("heraldHud-npcsMiddleContainer");

  let arrPlayerPartyList = await hl.heraldHud_getPlayerPartyList(
    user,
    selectedActor,
    "name"
  );
  let arrAllNpcs = await hl.heraldHud_getAllNpcsByParty(arrPlayerPartyList);
  let listNpcs = ``;

  let searchNpcs = document.getElementById("heraldHud-searchNpcs");
  let valueSearch = "";
  if (searchNpcs) {
    valueSearch = searchNpcs.value.toLowerCase();
  }

  let filteredNpcs = [];

  for (let data of arrAllNpcs) {
    let pageName = data.name.toLowerCase();
    if (pageName.indexOf(valueSearch) !== -1) {
      filteredNpcs.push(data);
    }
  }

  let favoriteNpcs = [];
  let otherNpcs = [];

  for (let npc of filteredNpcs) {
    const foundJournal = game.journal.contents.find(
      (j) => j.id === npc.journalId && j.folder?.id === npc.folderId
    );
    const foundPage = foundJournal?.pages.get(npc.pageId);
    const favArray = foundPage?.flags?.favorites || [];

    const isFavorite = favArray.includes(user.id);
    if (isFavorite) favoriteNpcs.push(npc);
    else otherNpcs.push(npc);
  }
  favoriteNpcs.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  otherNpcs.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
  if (favoriteNpcs.length > 0) {
    for (let npc of favoriteNpcs) {
      let icon = "";
      if (npc.gender === "Male") {
        icon = '<i class="fa-solid fa-mars" style="color:rgb(32, 0, 212)"></i>';
      } else if (npc.gender === "Female") {
        icon =
          '<i class="fa-solid fa-venus" style="color:rgb(216, 0, 198)"></i>';
      } else if (npc.gender === "Other") {
        icon = '<i class="fa-solid fa-question" style="color:white"></i>';
      } else if (npc.gender === "They") {
        icon =
          '<i class="fa-solid fa-mars-and-venus" style="color:rgb(121, 0, 235)"></i>';
      }
      listNpcs += `
        <div id="heraldHud-npcsPartyContainer" class="heraldHud-npcsPartyContainer" data-journalId="${npc.journalId}" data-pageId="${npc.pageId}">
            <div id="heraldHud-npcsPartyLeft" class="heraldHud-npcsPartyLeft">
                <div class="heraldHud-npcsPartyImageContainer">
                  <img src="${npc.fullImg}" alt="" class="heraldHud-npcsPartyImageView" />
                  <div class="heraldHud-npcsPartyFavoriteButton" data-id="${npc.folderId}|${npc.journalId}|${npc.pageId}" data-type="isFavorited" style="color:gold;">
                    <i class="fa-solid fa-star"></i>
                  </div>
                </div>
              
            </div>
            <div id="heraldHud-npcsPartyMiddle" class="heraldHud-npcsPartyMiddle">
              <div id="heraldHud-npcsPartyName" class="heraldHud-npcsPartyName">${npc.name}</div>
              <div id="heraldHud-npcsPartyGender" class="heraldHud-npcsPartyGender">${icon}</div>
              <div id="heraldHud-npcsPartyFaction" class="heraldHud-npcsPartyFaction">${npc.faction}</div>
              <div id="heraldHud-npcsPartyPartyname" class="heraldHud-npcsPartyPartyname">${npc.party}</div>
            </div>
            <div id="heraldHud-npcsPartyRight" class="heraldHud-npcsPartyRight">
              <div class="heraldHud-npcsPartyDelete heraldHud-npcsPartyDeleteParent"  data-journalId="${npc.journalId}" data-pageId="${npc.pageId}" data-folderId="${npc.folderId}">
                <i class="fa-solid fa-trash"></i>
                <span class="heraldHud-npcsPartyDeleteTooltip">Delete Npc</span>
              </div>
            </div>
        </div>
      `;
    }
    listNpcs += `<hr style="border: none; border-top: 2px solid #aaa; margin: 16px 0;">`;
  }

  for (let npc of otherNpcs) {
    let icon = "";
    if (npc.gender === "Male") {
      icon = '<i class="fa-solid fa-mars" style="color:rgb(32, 0, 212)"></i>';
    } else if (npc.gender === "Female") {
      icon = '<i class="fa-solid fa-venus" style="color:rgb(216, 0, 198)"></i>';
    } else if (npc.gender === "Other") {
      icon = '<i class="fa-solid fa-question" style="color:white"></i>';
    } else if (npc.gender === "They") {
      icon =
        '<i class="fa-solid fa-mars-and-venus" style="color:rgb(121, 0, 235)"></i>';
    }
    listNpcs += `
      <div id="heraldHud-npcsPartyContainer" class="heraldHud-npcsPartyContainer" data-journalId="${npc.journalId}" data-pageId="${npc.pageId}">
          <div id="heraldHud-npcsPartyLeft" class="heraldHud-npcsPartyLeft">
              <div class="heraldHud-npcsPartyImageContainer">
                <img src="${npc.fullImg}" alt="" class="heraldHud-npcsPartyImageView" />
                <div class="heraldHud-npcsPartyFavoriteButton" data-id="${npc.folderId}|${npc.journalId}|${npc.pageId}" data-type="notFavorited" style="color:rgb(175, 175, 175);">
                  <i class="fa-solid fa-star"></i>
                </div>
              </div>
            
          </div>
          <div id="heraldHud-npcsPartyMiddle" class="heraldHud-npcsPartyMiddle">
            <div id="heraldHud-npcsPartyName" class="heraldHud-npcsPartyName">${npc.name}</div>
            <div id="heraldHud-npcsPartyGender" class="heraldHud-npcsPartyGender">${icon}</div>
            <div id="heraldHud-npcsPartyFaction" class="heraldHud-npcsPartyFaction">${npc.faction}</div>
            <div id="heraldHud-npcsPartyPartyname" class="heraldHud-npcsPartyPartyname">${npc.party}</div>
          </div>
          <div id="heraldHud-npcsPartyRight" class="heraldHud-npcsPartyRight" >
            <div class="heraldHud-npcsPartyDelete heraldHud-npcsPartyDeleteParent" data-journalId="${npc.journalId}" data-pageId="${npc.pageId}" data-folderId="${npc.folderId}">
              <i class="fa-solid fa-trash"></i>
              <span class="heraldHud-npcsPartyDeleteTooltip">Delete Npc</span>
            </div>
          </div>
      </div>
    `;
  }

  if (dialogMiddle) {
    dialogMiddle.innerHTML = listNpcs;

    const npcDiv = document.querySelectorAll(".heraldHud-npcsPartyContainer");

    npcDiv.forEach((pageEl) => {
      pageEl.addEventListener("click", async (event) => {
        if (
          event.target.closest(".heraldHud-npcsPartyFavoriteButton") ||
          event.target.closest(".heraldHud-npcsPartyDelete")
        ) {
          return;
        }

        const journalId = pageEl.getAttribute("data-journalId");
        const pageId = pageEl.getAttribute("data-pageId");

        const journal = game.journal.get(journalId);
        if (!journal) return;

        const page = journal.pages.get(pageId);
        if (!page) return;

        await page.sheet.render(true);
      });
    });

    const favoriteButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-npcsPartyFavoriteButton"
    );

    favoriteButtons.forEach((favoriteButton) => {
      favoriteButton.addEventListener("click", async function (event) {
        const dataId = event.currentTarget.getAttribute("data-id");

        const [folderId, journalId, pageId] = dataId.split("|");

        const data = { folderId, journalId, pageId };
        const type = event.currentTarget.getAttribute("data-type");

        await heraldHud_changeNpcsFavorite(data, type);
      });
    });

    const deleteButtons = dialogMiddle.querySelectorAll(
      ".heraldHud-npcsPartyDelete"
    );

    deleteButtons.forEach((deleteButton) => {
      deleteButton.addEventListener("click", async function (event) {
        const journalId = event.currentTarget.getAttribute("data-journalId");
        const pageId = event.currentTarget.getAttribute("data-pageId");

        await heraldHud_deleteNpcWithConfirmation(journalId, pageId);
      });
    });
  }
}

async function heraldHud_changeNpcsFavorite(data, type) {
  let user = game.user;
  let foundJournal = game.journal.contents.find(
    (j) => j.id === data.journalId && j.folder?.id === data.folderId
  );
  let foundPage = foundJournal?.pages.get(data.pageId);
  let favorites = foundPage.flags?.favorites;
  if (type == "notFavorited") {
    if (!favorites) {
      await foundPage.update({
        "flags.favorites": [user.id],
      });
    } else {
      if (!favorites.includes(user.id)) {
        favorites.push(user.id);
        await foundPage.update({
          "flags.favorites": favorites,
        });
      }
    }
  } else if (type == "isFavorited") {
    if (Array.isArray(favorites)) {
      let updatedFavorites = favorites.filter((id) => id !== user.id);

      await foundPage.update({
        "flags.favorites": updatedFavorites,
      });
    }
  }
  foundPage = foundJournal?.pages.get(data.pageId);
  await heraldHud_renderNpcsMiddleContainer();
}

async function heraldHud_deleteNpcWithConfirmation(journalId, pageId) {
  const confirmationDialog = new Dialog({
    title: "Confirm NPC Deletion",
    content: "<p>Are you sure you want to delete this NPC?</p>",
    buttons: {
      confirm: {
        label: "Delete",
        callback: async () => {
          try {
            const journal = game.journal.get(journalId);
            if (journal) {
              const page = journal.pages.get(pageId);
              if (page) {
                await page.delete();
                ui.notifications.info("NPC successfully deleted.");
                await heraldHud_renderNpcsMiddleContainer();
              } else {
                ui.notifications.error("Page not found.");
              }
            } else {
              ui.notifications.error("Journal not found.");
            }
          } catch (error) {
            console.error("Error deleting NPC page:", error);
            ui.notifications.error("An error occurred while deleting the NPC.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        callback: () => {
          console.log("NPC deletion cancelled.");
        },
      },
    },
    defaultButton: "cancel",
  });

  confirmationDialog.render(true);
}

Hooks.on("createJournalEntryPage", (page, options, userId) => {
  const user = game.users.get(userId);
  const journal = page.parent;

  heraldHud_journalingSocket.executeAsGM(
    "backupHeralHudJournalByPage",
    user,
    journal
  );
});
Hooks.on("updateJournalEntryPage", async (page, changes, options, userId) => {
  const user = game.users.get(userId);
  const journal = page.parent;

  heraldHud_journalingSocket.executeAsGM(
    "backupHeralHudJournalByPage",
    user,
    journal
  );
  await heraldHud_renderListPartyJournalMiddleContainer();
  await heraldHud_renderListPersonalNotesMiddleContainer();
  await heraldHud_renderNpcsMiddleContainer();
  await heraldHud_renderQuestPage();
  await heraldHud_renderListQuest();
});

// ?????????????????????????????????????????????????????????????

async function heraldHud_deletePages(type, journalId, pageId) {
  const confirmationDialog = new Dialog({
    title: "Confirm Delete Page",
    content: "<p>Are you sure you want to delete this Page?</p>",
    buttons: {
      confirm: {
        label: "Delete",
        callback: async () => {
          try {
            const journal = game.journal.get(journalId);
            if (journal) {
              const page = journal.pages.get(pageId);
              if (page) {
                await page.delete();
                if (type == "personal notes") {
                  await heraldHud_renderListPersonalNotesMiddleContainer();
                } else if (type == "party journal") {
                  await heraldHud_renderListPartyJournalMiddleContainer();
                } else if (type == "npcs") {
                }
              } else {
                ui.notifications.error("Page not found.");
              }
            } else {
              ui.notifications.error("Journal not found.");
            }
          } catch (error) {}
        },
      },
      cancel: {
        label: "Cancel",
        callback: () => {},
      },
    },
    defaultButton: "cancel",
  });

  confirmationDialog.render(true);
}

export { heraldHud_renderListMenu };   
