import { fetchAllArtists } from "../services/artistService.js";
import { initCarousel } from "./carousel.js";

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
        <div class="hit-card track-artist-item">
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

      artist.querySelectorAll(".artist-play-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const artistId = e.currentTarget.data.artistId;
          console.log("Play artist:", artistId);
        });
      });
    }

    // Tìm carousel wrapper (querySelector bằng class trong selection)
    const carouselWrapper = document.querySelector(
      ".artist-section .carousel-wrapper"
    );

    if (carouselWrapper) {
      initCarousel(
        "artist-section",
        "popular-artists-track",
        "popular-artists-pagination",
        totalItems,
        5
      );
    }

    // Return để main.js dùng (nếu cần)
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
