async function heraldHud_createCompendiumPersonalNotesFolder(user) {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  if (!pack) {
    return ui.notifications.error(
      `Compendium "herald-hud.herald-hud-backup" not found.`
    );
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
  console.log(journalEntry);
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  if (!pack) {
    return ui.notifications.error(
      `Compendium "herald-hud.herald-hud-backup" not found.`
    );
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

async function heraldHud_createCompediumPartyJournalFolder() {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(
      `Compendium "herald-hud.herald-hud-backup" not found.`
    );
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
  console.log(journalEntry);
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  const journalFolders = game.folders.filter((f) => f.type === "JournalEntry");
  if (!pack) {
    return ui.notifications.error(
      `Compendium "herald-hud.herald-hud-backup" not found.`
    );
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

export {
  heraldHud_createCompendiumPersonalNotesFolder,
  heraldHud_backupJournalPersonalNotes,
  heraldHud_createCompediumPartyJournalFolder,
  heraldHud_backupJournalPartyJournal,
};
