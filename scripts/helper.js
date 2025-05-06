async function heraldHud_getPlayerPartyList(user, actor, type) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldCoreFolder = "";
  let heraldCorePartyFolder = "";
  let heraldHudFolder = "";
  let partyJournalFolder = "";

  for (let folder of folders) {
    if (folder.name == "Herald Core") {
      heraldCoreFolder = folder;
    }

    if (folder.name == "Party" && folder.folder.id == heraldCoreFolder.id) {
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

  let userUuid = user.uuid;
  let actorUuid = actor.uuid;
  let arrUserPartyFolder = [];
  const partyList = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder.id
  );
  partyList.forEach((pj) => {
    const page = pj.pages.find(
      (page) => page.name === `${userUuid} | ${actorUuid}`
    );

    if (page) {
      const matchingFolder = folders.find(
        (folder) =>
          folder.name === pj.name && folder.folder.id === partyJournalFolder.id
      );

      if (matchingFolder) {
        if (type == "name") {
          arrUserPartyFolder.push(matchingFolder.name);
        } else {
          arrUserPartyFolder.push(matchingFolder);
        }
      }
    }
  });
  return arrUserPartyFolder;
}

async function heraldHud_getAllNpcsByParty(partylist) {
  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldHudFolder = folders.find((f) => f.name === "Herald Hud");
  let npcsFolder = folders.find(
    (f) => f.name === "Npcs" && f.folder?.id === heraldHudFolder?.id
  );
  let arrJournalNpcsParty = [];
  let allPages = [];
  let allNpcsData = [];

  if (!heraldHudFolder || !npcsFolder) {
    console.warn("Folder 'Herald Hud' atau 'Npcs' tidak ditemukan");
  } else {
    for (let folder of folders) {
      for (let party of partylist) {
        if (folder.name === party && folder.folder?.id === npcsFolder.id) {
          const journalName = `${party} NPCs`;
          const foundJournal = game.journal.contents.find(
            (j) => j.name === journalName && j.folder?.id === folder.id
          );
          if (foundJournal) {
            arrJournalNpcsParty.push(foundJournal);
            allPages.push({
              party: party,
              folder: folder.id,
              journalId: foundJournal.id,
              pages: foundJournal.pages.contents,
            });
          }
        }
      }
    }
  }

  for (let group of allPages) {
    for (let page of group.pages) {
      const data = await heraldHud_parsePageHTMLContent(page.text.content);
      if (data.name && data.faction && data.race) {
        data.party = group.party;
        data.pageId = page.id;
        data.journalId = group.journalId;
        data.folderId = group.folder;
        allNpcsData.push(data);
      }
    }
  }
  return allNpcsData;
}

async function heraldHud_parsePageHTMLContent(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const data = {
    img: "",
    name: "",
    gender: "",
    faction: "",
    race: "",
    publicNotes: "",
    extraNotes: "",
  };

  const imgElement = doc.querySelector("img");
  if (imgElement) {
    const src = imgElement.src;
    const match = src.match(/(systems\/.*)/);
    data.img = match ? match[1] : "";
  }

  const paragraphs = doc.querySelectorAll("p");
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    const strong = p.querySelector("strong");
    if (!strong) continue;

    const label = strong.textContent.trim().toLowerCase();

    if (label.includes("name")) {
      data.name = p.textContent.split(":")[1]?.trim() || "";
    } else if (label.includes("gender")) {
      data.gender = p.textContent.split(":")[1]?.trim() || "";
    } else if (label.includes("faction")) {
      data.faction = p.textContent.split(":")[1]?.trim() || "";
    } else if (label.includes("race")) {
      data.race = p.textContent.split(":")[1]?.trim() || "";
    } else if (label.includes("public notes")) {
      const nextP = paragraphs[i + 1];
      if (nextP) {
        data.publicNotes = nextP.textContent.trim();
      }
    } else if (label.includes("extra notes")) {
      const nextP = paragraphs[i + 1];
      if (nextP) {
        data.extraNotes = nextP.textContent.trim();
      }
    }
  }

  return data;
}

export { heraldHud_getPlayerPartyList, heraldHud_getAllNpcsByParty };
