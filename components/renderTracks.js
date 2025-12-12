import {
  fetchTrendingTracks,
  fetchPopularTracks,
} from "../services/tracksService.js";
import musicPlayer from "./musicPlayer.js";

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

    // Load playing vào music player
    if (data.length > 0) {
      musicPlayer.loadPlaylist(data, 0);
    }

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
