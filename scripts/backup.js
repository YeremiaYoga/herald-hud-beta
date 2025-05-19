async function heraldHud_createCompendiumPersonalNotesFolder(user) {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }
  let playerFolder = "";
  const folders = pack.folders;

  const personalNotesFolder = folders.find((f) => f.name === "Personal Notes");

  if (!personalNotesFolder) {
    const folderData = {
      name: "Personal Notes",
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      sorting: "a",
    };
    personalNotesFolder = await Folder.create(folderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
  if (personalNotesFolder) {
    playerFolder = folders.find(
      (f) => f.name === user.name && f.folder?.id === personalNotesFolder.id
    );
  }

  if (!playerFolder) {
    const playerFolderData = {
      name: user.name,
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      folder: personalNotesFolder.id,
      sorting: "a",
    };
    playerFolder = await Folder.create(playerFolderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
}

async function heraldHud_backupJournalPersonalNotes(user, journalEntry) {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }

  let playerCompedium = "";
  let todayFolder = "";
  const foldersCompedium = pack.folders;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const todayDate = `${day}-${month}-${year}`;

  const personalNotesCompedium = foldersCompedium.find(
    (f) => f.name === "Personal Notes"
  );

  if (personalNotesCompedium) {
    playerCompedium = foldersCompedium.find(
      (f) => f.name === user.name && f.folder?.id === personalNotesCompedium.id
    );
  }
  if (playerCompedium) {
    todayFolder = foldersCompedium.find(
      (f) => f.name === todayDate && f.folder?.id === playerCompedium.id
    );
  }
  const foldersJournal = game.folders.filter((f) => f.type === "JournalEntry");
  let heraldHudFolder = "";
  let personalNotesFolder = "";
  let playerFolder = "";
  for (let folder of foldersJournal) {
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

  if (!todayFolder) {
    const todayFolderData = {
      name: todayDate,
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      folder: playerCompedium.id,
      sorting: "a",
    };
    todayFolder = await Folder.create(todayFolderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });

    const journalEntries = game.journal.filter(
      (entry) => entry.folder?.id === playerFolder.id
    );
    for (let journalEntry of journalEntries) {
      const newJournalEntryData = {
        name: journalEntry.name,
        content: journalEntry.content,
        folder: todayFolder.id,
        flags: journalEntry.flags,
        ownership: journalEntry.ownership,
      };

      await JournalEntry.create(newJournalEntryData, {
        pack: "herald-hud-beta.herald-hud-backup",
      });
    }
  }
  const existingJournal = pack.index.find(
    (entry) =>
      entry.name === journalEntry.name && entry.folder === todayFolder.id
  );
  if (existingJournal) {
    await pack.documentClass.deleteDocuments([existingJournal._id], {
      pack: pack.collection,
    });
  }
  const newJournalEntryData = duplicate(journalEntry.toObject());
  newJournalEntryData.folder = todayFolder.id;
  delete newJournalEntryData._id;
  for (let page of newJournalEntryData.pages) {
    delete page._id;
  }

  await JournalEntry.create(newJournalEntryData, {
    pack: "herald-hud-beta.herald-hud-backup",
  });
}

/* ------------------------------------------------------------------------------
   DIALOG PARTY JOURNAL BACKUP
------------------------------------------------------------------------------- */

async function heraldHud_createCompediumPartyJournalFolder() {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }
  let heraldHudFolder = "";
  let partyJournalFolder = "";
  for (let folder of journalFolders) {
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
  const compediumFolder = pack.folders;
  let listPartyJournalFolder = compediumFolder.find(
    (f) => f.name === "Party Journal"
  );

  if (!listPartyJournalFolder) {
    const folderData = {
      name: "Party Journal",
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      sorting: "a",
    };
    listPartyJournalFolder = await Folder.create(folderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
  if (listPartyJournalFolder) {
    const relevantJournalFolders = journalFolders.filter(
      (f) => f.folder?.id === partyJournalFolder.id
    );
    const existingFolderNames = new Set(compediumFolder.map((f) => f.name));
    for (let jFolder of relevantJournalFolders) {
      if (!existingFolderNames.has(jFolder.name)) {
        const partyFolderCompedium = {
          name: jFolder.name,
          type: "JournalEntry",
          compendium: "herald-hud-beta.herald-hud-backup",
          folder: listPartyJournalFolder.id,
          sorting: "a",
        };
        await Folder.create(partyFolderCompedium, {
          pack: "herald-hud-beta.herald-hud-backup",
        });
      }
    }
  }
}

async function heraldHud_backupJournalPartyJournal(journalEntry) {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }

  let partyJournalCompendium = "";
  let todayFolder = "";
  const compendiumFolder = pack.folders;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const todayDate = `${day}-${month}-${year}`;
  const heraldHudFolder = journalFolders.find((f) => f.name === "Herald Hud");
  if (!heraldHudFolder) {
    return ui.notifications.error(`Folder "Herald Hud" not found.`);
  }

  const partyJournalFolder = journalFolders.find(
    (f) => f.name === "Party Journal" && f.folder?.id === heraldHudFolder.id
  );
  if (!partyJournalFolder) {
    return ui.notifications.error(
      `Folder "Party Journal" not found under "Herald Hud".`
    );
  }

  const typeName = journalEntry.flags?.type;
  if (!typeName) {
    return ui.notifications.warn(`Journal entry has no 'type' flag.`);
  }

  const partyFolder = journalFolders.find(
    (f) => f.name === typeName && f.folder?.id === partyJournalFolder.id
  );
  if (!partyFolder) {
    return ui.notifications.warn(
      `Folder for party type "${typeName}" not found.`
    );
  }

  let listPartyJournalFolder = compendiumFolder.find(
    (f) => f.name === "Party Journal"
  );

  if (listPartyJournalFolder) {
    partyJournalCompendium = compendiumFolder.find(
      (f) =>
        f.folder?.id == listPartyJournalFolder.id &&
        f.name == journalEntry.flags.type
    );
  }

  if (partyJournalCompendium) {
    todayFolder = compendiumFolder.find(
      (f) => f.name === todayDate && f.folder?.id === partyJournalCompendium.id
    );
  }
  if (!todayFolder) {
    const todayFolderData = {
      name: todayDate,
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      folder: partyJournalCompendium.id,
      sorting: "a",
    };
    todayFolder = await Folder.create(todayFolderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });

    const journalEntries = game.journal.filter(
      (entry) => entry.folder?.id === partyFolder.id
    );
    for (let journalEntry of journalEntries) {
      const newJournalEntryData = {
        name: journalEntry.name,
        content: journalEntry.content,
        folder: todayFolder.id,
        flags: journalEntry.flags,
        ownership: journalEntry.ownership,
      };

      await JournalEntry.create(newJournalEntryData, {
        pack: "herald-hud-beta.herald-hud-backup",
      });
    }
  } else {
    const existingJournal = pack.index.find(
      (entry) =>
        entry.name === journalEntry.name && entry.folder === todayFolder.id
    );
    if (existingJournal) {
      await pack.documentClass.deleteDocuments([existingJournal._id], {
        pack: pack.collection,
      });
    }
    const newJournalEntryData = duplicate(journalEntry.toObject());
    newJournalEntryData.folder = todayFolder.id;
    delete newJournalEntryData._id;
    for (let page of newJournalEntryData.pages) {
      delete page._id;
    }

    await JournalEntry.create(newJournalEntryData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
}

/* ------------------------------------------------------------------------------
   DIALOG NPCS BACKUP
------------------------------------------------------------------------------- */

async function heraldHud_createCompediumNpcsFolder() {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }
  let heraldHudFolder = "";
  let npcsFolder = "";
  for (let folder of journalFolders) {
    if (folder.name == "Herald Hud") {
      heraldHudFolder = folder;
    }
    if (folder.name == "Npcs" && folder.folder.id == heraldHudFolder.id) {
      npcsFolder = folder;
    }
  }
  const compediumFolder = pack.folders;
  let listNpcsFolder = compediumFolder.find((f) => f.name === "Npcs");

  if (!listNpcsFolder) {
    const folderData = {
      name: "Npcs",
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      sorting: "a",
    };
    listNpcsFolder = await Folder.create(folderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
  if (listNpcsFolder) {
    const relevantJournalFolders = journalFolders.filter(
      (f) => f.folder?.id === npcsFolder.id
    );

    const existingFolderNames = new Set(
      compediumFolder
        .filter((f) => f.folder?.id === listNpcsFolder.id)
        .map((f) => f.name)
    );
    for (let jFolder of relevantJournalFolders) {
      if (!existingFolderNames.has(jFolder.name)) {
        const partyFolderCompedium = {
          name: jFolder.name,
          type: "JournalEntry",
          compendium: "herald-hud-beta.herald-hud-backup",
          folder: listNpcsFolder.id,
          sorting: "a",
        };
        await Folder.create(partyFolderCompedium, {
          pack: "herald-hud-beta.herald-hud-backup",
        });
      }
    }
  }
}

async function heraldHud_backupJournalNpcs(uuid) {
  const journalEntry = await fromUuid(uuid);

  const pack = await game.packs.get("herald-hud-beta.herald-hud-backup");
  // const pack = game.packs.get("world.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(`Compendium "herald-hud-backup" not found.`);
  }
  let npcsCompendium = "";
  let todayFolder = "";
  const compendiumFolder = pack.folders;

  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const todayDate = `${day}-${month}-${year}`;
  const heraldHudFolder = journalFolders.find((f) => f.name === "Herald Hud");
  if (!heraldHudFolder) {
    return ui.notifications.error(`Folder "Herald Hud" not found.`);
  }

  const npcsFolder = journalFolders.find(
    (f) => f.name === "Npcs" && f.folder?.id === heraldHudFolder.id
  );
  if (!npcsFolder) {
    return ui.notifications.error(
      `Folder "Npcs" not found under "Herald Hud".`
    );
  }

  const cleanName = journalEntry.name.trim().split(" ").slice(0, -1).join(" ");

  const partyFolder = journalFolders.find(
    (f) => f.name === cleanName && f.folder?.id === npcsFolder.id
  );
  if (!partyFolder) {
    return ui.notifications.error(
      `Folder "Party" not found under "Herald Hud".`
    );
  }

  let listNpcsFolder = compendiumFolder.find((f) => f.name === "Npcs");

  if (listNpcsFolder) {
    npcsCompendium = compendiumFolder.find(
      (f) => f.folder?.id == listNpcsFolder.id && f.name == cleanName
    );
  }
  if (npcsCompendium) {
    todayFolder = compendiumFolder.find(
      (f) => f.name === todayDate && f.folder?.id === npcsCompendium.id
    );
  }

  if (!todayFolder) {
    const todayFolderData = {
      name: todayDate,
      type: "JournalEntry",
      compendium: "herald-hud-beta.herald-hud-backup",
      folder: npcsCompendium.id,
      sorting: "a",
    };
    todayFolder = await Folder.create(todayFolderData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });

    const newJournalEntryData = {
      name: journalEntry.name,
      folder: todayFolder.id,
      pages: journalEntry.pages.map((page) => {
        const pageData = duplicate(page);
        delete pageData._id;
        return pageData;
      }),

      flags: journalEntry.flags,
      content: journalEntry.content,
      img: journalEntry.img,
    };

    await JournalEntry.create(newJournalEntryData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  } else {
    const docs = await pack.getDocuments();

    const existingJournal = docs.find(
      (doc) =>
        doc.name === journalEntry.name && doc.folder?.id === todayFolder.id
    );

    if (existingJournal) {
      await existingJournal.delete({ pack: pack.collection });
    }
    const newJournalEntryData = {
      name: journalEntry.name,
      folder: todayFolder.id,
      pages: journalEntry.pages.map((page) => {
        const pageData = duplicate(page);
        delete pageData._id;
        return pageData;
      }),
      flags: journalEntry.flags,
      content: journalEntry.content,
      img: journalEntry.img,
    };

    await JournalEntry.create(newJournalEntryData, {
      pack: "herald-hud-beta.herald-hud-backup",
    });
  }
}

export {
  heraldHud_createCompendiumPersonalNotesFolder,
  heraldHud_backupJournalPersonalNotes,
  heraldHud_createCompediumPartyJournalFolder,
  heraldHud_backupJournalPartyJournal,
  heraldHud_createCompediumNpcsFolder,
  heraldHud_backupJournalNpcs,
};
