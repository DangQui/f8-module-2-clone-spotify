import {
  fetchAllArtists,
  fetchArtistById,
  fetchArtistPopularTracks,
} from "../services/artistService.js";
import { formatMonthlyListeners } from "../utils/numberFormat.js";
import { formatTrackDuration } from "../utils/timeFormat.js";

let handelArtistClick = null;

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
      artistData.monthly_listeners
    );
  }
}

// Hàm xử lý render popular track
async function renderArtistPopularTracks(artistId, limit = 10) {
  try {
    const response = await fetchArtistPopularTracks(artistId);
    const tracks = response.tracks || [];
    const trackList = document.querySelector(".popular-section .track-list");

    if (response.pagination.total === 0) {
      trackList.innerHTML = `<p class="no-data">No popular tracks!</p>`;
      return;
    }

    trackList.innerHTML = ""; // Clear toàn bộ nội dung cũ trong .track-list
    tracks.slice(0, limit).forEach((track, index) => {
      const trackItem = document.createElement("div");
      trackItem.className = "track-item";
      // Giả lập active item đầu tiên
      if (index === 0) trackItem.classList.add("playing");
      // Set id cho từng track
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
  } catch (error) {
    console.error("Error rendering artist popular tracks:", error);
    const trackList = document.querySelector(".popular-section .track-list");
    if (trackList)
      trackList.innerHTML = `<p class="no-data">Error loading tracks</p>`;
  }
}

handelArtistClick = async (e) => {
  const card = e.target.closest(".hit-card[data-artist-id]");
  const playBtn = e.target.closest(".artist-play-btn");

  hitSection.classList.remove("show");
  artistSection.classList.remove("show");
  artistHero.classList.add("show");
  artistControls.classList.add("show");
  popularSection.classList.add("show");

  window.scrollTo({ top: 0, behavior: "smooth" });

  // Kiểm tra click vào card hay vào playBtn
  if (card || playBtn) {
    const artistId = card ? card.dataset.artistId : playBtn.dataset.artistId;
    if (artistId) {
      try {
        const artistData = await fetchArtistById(artistId);
        await renderArtistHero(artistData);
        await renderArtistPopularTracks(artistId);
      } catch (error) {
        console.error("Lỗi fetch artist by Id", error);
      }
    }
  }
};

export async function renderPopularArtists(limit = 20, offset = 0) {
  try {
    const data = await fetchAllArtists(limit, offset);
    const artists = data.artists;

    // Tính total items từ data. Dùng cho carousel
    const totalItems = data.pagination?.total;
    const artist = document.getElementById("popular-artists-track");
    if (artist) {
      artist.innerHTML = artists
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
      `
        )
        .join("");

      if (handelArtistClick)
        artist.removeEventListener("click", handelArtistClick);

      artist.addEventListener("click", handelArtistClick);

      // artist.querySelectorAll(".artist-play-btn").forEach((btn) => {
      //   btn.addEventListener("click", (e) => {
      //     const artistId = e.currentTarget.data.artistId;
      //     console.log("Play artist:", artistId);
      //   });
      // });
    }

    return artists;
  } catch (error) {
    console.error("Error rendering popular artists:", error);

    // Nếu track tồn tại, set no-data message thay vì empty
    const track = document.getElementById("popular-artists-track");
    if (track) {
      track.innerHTML = `<p class="no-data">No popular artists available</p>`;
      return [];
    }
  }
}
