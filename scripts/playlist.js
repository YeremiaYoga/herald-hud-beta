Hooks.on("canvasReady", async () => {
  if (canvas.scene.active == true) {
  } else {
  }
});

function heraldPlaylist_renderButton() {
  const existingBar = document.getElementById("heraldPlaylist");
  if (existingBar) {
    existingBar.remove();
  }

  fetch(
    "/modules/herald-playlist-beta/templates/heraldPlaylist-playlistButton.html"
  )
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const playlist = div.firstChild;
      playlist.id = "heraldPlaylist";

      const playlistButton = document.createElement("button");
      playlistButton.id = "heraldPlaylist-playlistButton";
      playlistButton.classList.add("heraldPlaylist-playlistButton");
      playlistButton.innerHTML = "<i class='fas fa-music'></i>";
      playlistButton.addEventListener("click", function () {
        heraldPlaylist_dialogPlaylist();
      });

      playlist.appendChild(playlistButton);
      document.body.appendChild(playlist);
    })
    .catch((err) => {
      console.error("Gagal memuat template playlist.html:", err);
    });
}

function heraldPlaylist_dialogPlaylist() {
  const globalSettings = {
    musicVolume: game.settings.get("core", "globalPlaylistVolume"),
    ambientVolume: game.settings.get("core", "globalAmbientVolume"),
    interfaceVolume: game.settings.get("core", "globalInterfaceVolume"),
  };

  const content = `
  <form>
     <div class="heraldPlaylist-formGrup">
      <label>Music Volume:</label>
      <div class="heraldPlaylist-volumeControl">
        <button type="button" id="heraldPlaylist-music-low">Low</button>
        <button type="button" id="heraldPlaylist-music-medium">Medium</button>
        <button type="button" id="heraldPlaylist-music-high">High</button>
      </div>
    </div>
    <div class="heraldPlaylist-formGrup">
      <label for="heraldPlaylist-ambient-volume">Environment Volume: <span id="heraldPlaylist-ambient-volume-value">${(
        globalSettings.ambientVolume * 100
      ).toFixed(0)}%</span></label>
      <div class="heraldPlaylist-volumeControl">
        <input type="range" id="heraldPlaylist-ambient-volume" name="ambientVolume" min="0" max="1" step="0.01" value="${
          globalSettings.ambientVolume
        }">
        <input type="number" id="heraldPlaylist-ambient-volume-input" value="${(
          globalSettings.ambientVolume * 100
        ).toFixed(0)}" min="0" max="100" step="1">
      </div>
    </div>
    <div class="heraldPlaylist-formGrup">
      <label for="heraldPlaylist-interface-volume">Interface Volume: <span id="heraldPlaylist-interface-volume-value">${(
        globalSettings.interfaceVolume * 100
      ).toFixed(0)}%</span></label>
      <div class="heraldPlaylist-volumeControl">
        <input type="range" id="heraldPlaylist-interface-volume" name="interfaceVolume" min="0" max="1" step="0.01" value="${
          globalSettings.interfaceVolume
        }">
        <input type="number" id="heraldPlaylist-interface-volume-input" value="${(
          globalSettings.interfaceVolume * 100
        ).toFixed(0)}" min="0" max="100" step="1">
      </div>
    </div>
  </form>
`;

  new Dialog({
    title: "Volume Settings",
    content: content,
    buttons: {
      save: {
        label: "Save",
        callback: (html) => {
          const musicVolume = parseFloat(
            html.find("#heraldPlaylist-music-volume").val()
          );
          const ambientVolume = parseFloat(
            html.find("#heraldPlaylist-ambient-volume").val()
          );
          const interfaceVolume = parseFloat(
            html.find("#heraldPlaylist-interface-volume").val()
          );

          game.settings.set("core", "globalPlaylistVolume", musicVolume);
          game.settings.set("core", "globalAmbientVolume", ambientVolume);
          game.settings.set("core", "globalInterfaceVolume", interfaceVolume);
        },
      },
      cancel: {
        label: "Cancel",
      },
    },
    render: (html) => {
      html.find("#heraldPlaylist-music-low").on("click", function () {
        game.settings.set("core", "globalPlaylistVolume", 0.35);
      });
      html.find("#heraldPlaylist-music-medium").on("click", function () {
        game.settings.set("core", "globalPlaylistVolume", 0.65);
      });
      html.find("#heraldPlaylist-music-high").on("click", function () {
        game.settings.set("core", "globalPlaylistVolume", 1);
      });

      html.find("input[type=range]").on("input", function () {
        const volumeValue = (parseFloat(this.value) * 100).toFixed(0);
        html.find(`#${this.id}-value`).text(`${volumeValue}%`);
        const inputId = this.id.replace("-volume", "-volume-input");
        html.find(`#${inputId}`).val(volumeValue);
      });

      html.find("input[type=number]").on("input", function () {
        const volumeValue = parseFloat(this.value);
        if (volumeValue >= 0 && volumeValue <= 100) {
          const sliderId = this.id.replace("-input", "");
          const normalizedValue = volumeValue / 100;
          html.find(`#${sliderId}`).val(normalizedValue);
          html.find(`#${sliderId}`).trigger("input");
        }
      });
    },
  }).render(true);
}

export { heraldPlaylist_dialogPlaylist };
