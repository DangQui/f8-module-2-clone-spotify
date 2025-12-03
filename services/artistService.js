import httpRequest from "./../utils/httpRequest.js";

// GET /api/artists
export async function fetchAllArtists(limit = 20, offset = 0) {
  try {
    const response = await httpRequest.get(
      `artists?limit=${limit}&offset=${offset}`
    );
    return response.artists || [];
  } catch (error) {
    console.error("Lỗi fetch all artists:", error);
    return [];
  }
}

// GET /api/artists/trending?limit=20
export async function fetchTrendingArtists(limit = 5) {
  try {
    const response = await httpRequest.get(`artists/trending?limit=${limit}`);
    return response.artists || [];
  } catch (error) {
    console.error("Lỗi fetch trending artists:", error);
    return [];
  }
}

export async function fetchArtistById(artistId) {
  try {
    console.log("Calling API with ID:", artistId); // Log input.
    const response = await httpRequest.get(`artists/${artistId}`); // GET method.
    return response || {};
  } catch (error) {
    console.error("Lỗi fetch Artist By ID:", error);
    return {};
  }
}
