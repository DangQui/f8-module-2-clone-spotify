import {
  fetchAllArtists,
  fetchArtistById,
  fetchArtistPopularTracks,
} from "../services/artistService.js";
import { formatMonthlyListeners } from "../utils/numberFormat.js";
import { formatTrackDuration } from "../utils/timeFormat.js";
import musicPlayer from "./musicPlayer.js";
import { syncHitPlayIcons, renderTrendingTracks } from "./renderTracks.js";
import ArtistFollowButton from "./artistFollowButton.js";

let handleArtistClick = null;
let currentArtistId = null;
let currentFollowButton = null;

const hitSection = document.querySelector(".hits-section");
const artistSection = document.querySelector(".artists-section");
const artistHero = document.querySelector(".artist-hero");
const artistControls = document.querySelector(".artist-controls");
const popularSection = document.querySelector(".popular-section");

// Hàm xử lý render Hero Artist
async function renderArtistHero(artistData) {
  const heroSection = document.querySelector(".artist-hero");
  if (!heroSection) {
    console.error("Artist hero section not found!");
    return;
  }

  if (!artistData) {
    const heroContent = heroSection.querySelector(".hero-content");
    if (heroContent) heroContent.innerHTML = `<p>No artist data</p>`;
    return;
  }

  const heroBackgroundImage = heroSection.querySelector(".hero-image");
  if (heroBackgroundImage) {
    heroBackgroundImage.src =
      artistData.background_image_url || "placeholder.svg";
    heroBackgroundImage.alt = artistData.name;
  }

  const heroContent = heroSection.querySelector(".hero-content");
  if (heroContent) {
    const artistName = heroContent.querySelector(".artist-name");
    const monthlyListeners = heroContent.querySelector(".monthly-listeners");
    artistName.textContent = artistData.name;
    monthlyListeners.textContent = formatMonthlyListeners(
      artistData.monthly_listeners,
    );
  }
}

// Hàm xử lý render popular track
export async function renderArtistPopularTracks(artistId, limit = 10) {
  try {
    const response = await fetchArtistPopularTracks(artistId);
    const tracks = response.tracks || [];
    const artist = response.artist || null;
    const trackList = document.querySelector(".popular-section .track-list");

    if (response.pagination.total === 0) {
      trackList.innerHTML = `<p class="no-data">No popular tracks!</p>`;
      return [];
    }

    trackList.innerHTML = "";

    const tracksWithArtist = tracks.slice(0, limit).map((track) => ({
      ...track,
      artist_name: artist?.name || "Unknown Artist",
    }));

    tracksWithArtist.forEach((track, index) => {
      const trackItem = document.createElement("div");
      trackItem.className = "track-item";
      if (index === 0) trackItem.classList.add("playing");
      trackItem.dataset.trackId = track.id;

      trackItem.innerHTML = `
        <div class="track-number">${index + 1}</div>
        <div class="track-image">
          <img src="${
            track.image_url || "placeholder.svg?height=40&width=40"
          }" alt="${track.title}" />
        </div>
        <div class="track-info">
          <div class="track-name">${track.title}</div>
        </div>
        <div class="track-plays">${track.play_count}</div>
        <div class="track-duration">${formatTrackDuration(track.duration)}</div>
        <button class="track-menu-btn" data-track-id="${
          track.id
        }"><i class="fas fa-ellipsis-h"></i></button>
      `;
      trackList.appendChild(trackItem);
    });

    return tracksWithArtist;
  } catch (error) {
    console.error("Error rendering artist popular tracks:", error);
    const trackList = document.querySelector(".popular-section .track-list");
    if (trackList)
      trackList.innerHTML = `<p class="no-data">Error loading tracks</p>`;

    return [];
  }
}

function initializeFollowButton(artistId) {
  if (currentFollowButton) {
    currentFollowButton = null;
  }

  currentFollowButton = new ArtistFollowButton(
    "artistFollowButtonContainer",
    artistId,
  );
  currentFollowButton.init();
}

// Setup event listener cho play-btn-large
function setupPlayBtnLarge() {
  const playLargeBtn = document.querySelector(
    ".artist-controls .play-btn-large",
  );

  if (!playLargeBtn) return;

  const newPlayBtn = playLargeBtn.cloneNode(true);
  playLargeBtn.parentNode.replaceChild(newPlayBtn, playLargeBtn);

  newPlayBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentArtistId) {
      console.warn("No current artist ID");
      return;
    }

    console.log("Play-btn-large clicked for artist:", currentArtistId);

    if (musicPlayer.isPlayingFromArtist(currentArtistId)) {
      if (musicPlayer._isPlaying) {
        musicPlayer.pause();
      } else {
        musicPlayer.play();
      }
      return;
    }

    try {
      const tracks = await renderArtistPopularTracks(currentArtistId);
      if (tracks.length > 0) {
        musicPlayer.loadPlaylist(tracks, 0, `artist:${currentArtistId}`);
        musicPlayer.play();
      } else {
        console.warn("No tracks for artist:", currentArtistId);
      }
    } catch (error) {
      console.error("Error loading artist tracks:", error);
    }
  });
}

// Xử lý click artist card
handleArtistClick = async (e) => {
  // Artist card được click
  const card = e.target.closest(".hit-card[data-artist-id]");
  // Kiểm tra xem có click vào nút play không
  const playBtn = e.target.closest(".artist-play-btn");

  // Nếu click vào nút play thì return (logic đã sử lý ở authModal.js)
  if (playBtn) {
    return;
  }

  // Nếu không phải artist card thì return
  if (!card) return;

  // Navigate: Ẩn home sections, hiện artist sections
  hitSection.classList.remove("show");
  artistSection.classList.remove("show");
  artistHero.classList.add("show");
  artistControls.classList.add("show");
  popularSection.classList.add("show");

  window.scrollTo({ top: 0, behavior: "smooth" });

  const artistId = card.dataset.artistId;
  if (artistId) {
    currentArtistId = artistId;

    try {
      const artistData = await fetchArtistById(artistId);
      await renderArtistHero(artistData);
      // await renderArtistPopularTracks(artistId);

      const tracks = await renderArtistPopularTracks(artistId);

      // Setup play button
      setupPlayBtnLarge();

      // Initialize follow button
      initializeFollowButton(artistId);

      // Sync UI
      syncHitPlayIcons();
    } catch (error) {
      console.error("Lỗi fetch artist by Id", error);
    }
  }
};

export async function renderPopularArtists(limit = 20, offset = 0) {
  try {
    const data = await fetchAllArtists(limit, offset);
    const artists = data.artists;

    const totalItems = data.pagination?.total;
    const artistTrack = document.getElementById("popular-artists-track");
    if (artistTrack) {
      artistTrack.innerHTML = artists
        .map(
          (artist) => `
        <div class="hit-card track-artist-item" data-artist-id="${artist.id}">
          <div class="artist-card-cover">
            <img src="${
              artist.image_url || "placeholder.svg?height=160&width=160"
            }" alt="${artist.name}" />
            <button class="artist-play-btn" data-artist-id="${artist.id}">
              <i class="fas fa-play"></i>
            </button>
          </div>
          <div class="artist-card-info">
            <h3 class="artist-card-name">${artist.name}</h3>
            <p class="artist-card-type">Artist</p>
          </div>
        </div>
      `,
        )
        .join("");

      // Remove event listener cũ trước khi add mới
      if (handleArtistClick)
        artistTrack.removeEventListener("click", handleArtistClick);

      // Gắn sự kiện listener mới
      artistTrack.addEventListener("click", handleArtistClick);
    }

    return artists;
  } catch (error) {
    console.error("Error rendering popular artists:", error);

    const track = document.getElementById("popular-artists-track");
    if (track) {
      track.innerHTML = `<p class="no-data">No popular artists available</p>`;
      return [];
    }
  }
}

// Hàm navigate về home
function goToHome() {
  currentArtistId = null;

  if (currentFollowButton) {
    currentFollowButton = null;
  }

  hitSection.classList.add("show");
  artistSection.classList.add("show");
  artistHero.classList.remove("show");
  artistControls.classList.remove("show");
  popularSection.classList.remove("show");

  const currentPlaylistType = musicPlayer.getCurrentPlaylistType();

  renderTrendingTracks(20, "#hits-container")
    .then(() => {
      if (musicPlayer) {
        musicPlayer._updatePlayerUI();
        syncHitPlayIcons();
      }
    })
    .catch((error) => {
      console.error("Error refreshing home:", error);
    });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

const homeBtn = document.querySelector(".home-btn");
const logoIcon = document.querySelector(".logo-icon");

if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    goToHome();
  });
}

if (logoIcon) {
  logoIcon.addEventListener("click", (e) => {
    e.preventDefault();
    goToHome();
  });
}
