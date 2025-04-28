async function heraldHud_createCompendiumFolder(user) {
  const pack = game.packs.get("herald-hud-beta.herald-hud-backup");
  if (!pack) {
    return ui.notifications.error(
      `Compendium "herald-hud.herald-hud-backup" not found.`
    );
  }
  let playerFolder = "";
  const folders = pack.folders;

  const personalNotesFolder = folders.find((f) => f.name === "Personal Notes");

  if (personalNotesFolder) {
    playerFolder = folders.find(
      (f) => f.name === user.name && f.folder?.id === personalNotesFolder.id
    );
  }
  console.log(personalNotesFolder);
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

export {
  heraldHud_createCompendiumFolder,
  heraldHud_backupJournalPersonalNotes,
};
