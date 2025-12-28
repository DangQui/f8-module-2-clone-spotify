import {
  fetchTrendingTracks,
  fetchPopularTracks,
} from "../services/tracksService.js";
import musicPlayer from "./musicPlayer.js";

// Hàm để sync icons cho tất cả hit-play-btn dựa trên current player state
export function syncHitPlayIcons() {
  const allHitBtns = document.querySelectorAll(".hit-play-btn[data-track-id]");
  allHitBtns.forEach((btn) => {
    const icon = btn.querySelector("i");
    const trackId = btn.dataset.trackId;
    if (icon) {
      // Revert tất cả về play
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
      btn.classList.remove("playing");

      // Nếu match current track và đang playing -> Set pause + playing
      if (
        musicPlayer &&
        musicPlayer._currentTrack?.id === trackId &&
        musicPlayer._isPlaying
      ) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
        btn.classList.remove("playing");
      }
    }
  });
  if (musicPlayer) {
    musicPlayer._highlightActiveTrack();
  }
}

// Render danh sách bài hát trending (cho carousel, dùng service + render nếu có selector)
export async function renderTrendingTracks(
  limit = 20,
  containerSelector = null
) {
  try {
    // Dùng service thay fetch trực tiếp
    const data = await fetchTrendingTracks(limit);

    if (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (container) {
        container.innerHTML = data
          .map(
            (item) => `
            <div class="hit-card track-artist-item" data-track-id="${item.id}" >
              <div class="hit-card-cover">
                <img src="${
                  item.image_url || "placeholder.svg?height=180&width=180"
                }" alt="${item.title}" />
                <button class="hit-play-btn" data-track-id="${item.id}">
                <i class="fas fa-play"></i>
              </button>
              </div>
              <div class="hit-card-info">
                <h3 class="hit-card-title">${item.title}</h3>
                <p class="hit-card-artist">${
                  item.artist_name || "Unknown Artist"
                }</p>
              </div>
              
            </div>
          `
          )
          .join("");
      }
    }

    // Điều này tránh ghi đè track hiện tại khi navigate
    const currentTrack = musicPlayer.getCurrentTrack();

    if (data.length > 0 && !currentTrack) {
      // Chỉ load playlist khi là lần đầu tiên (chưa có track)
      musicPlayer.loadPlaylist(data, 0);
    } else if (data.length > 0) {
      // Nếu đã có track, chỉ cập nhật playlist mà KHÔNG load track mới
      musicPlayer.updatePlaylistOnly(data);
    }

    syncHitPlayIcons();
    return data; // Return array tracks để main.js biết total
  } catch (error) {
    console.error("Error rendering trending tracks:", error);
    if (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (container)
        container.innerHTML = `<p class="no-data">No trending tracks available</p>`;
    }
    return [];
  }
}

// Render danh sách bài hát phổ biến (giữ nguyên, chỉ fix template syntax nhỏ)
export async function renderPopularTracks(
  limit = 5,
  containerSelector = ".track-list"
) {
  const tracks = await fetchPopularTracks(limit);
  const container = document.querySelector(containerSelector);
  if (!container) return;

  if (tracks.length === 0) {
    container.innerHTML = `<p class="no-data">No popular tracks</p>`;
    return;
  }

  container.innerHTML = tracks
    .map(
      (track, index) => `
      <div class="track-item">
        <div class="track-number">${track.track_number || index + 1}</div>
        <div class="track-image">
          <img src="${
            track.image_url || "placeholder.svg?height=40&width=40"
          }" alt="${track.title}" />
        </div>
        <div class="track-info">
          <div class="track-name">${track.title}</div>
        </div>
        <div class="track-plays">${track.play_count || "0"}</div>
        <div class="track-duration">4:18</div>
        <button class="track-menu-btn" data-track-id="${track.id}">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </div>
    `
    )
    .join("");
}
