import httpRequest from "./../utils/httpRequest.js";

// GET /api/artists
export async function fetchAllArtists(limit = 20, offset = 0) {
  try {
    const response = await httpRequest.get(
      `artists?limit=${limit}&offset=${offset}`
    );
    return response || {};
  } catch (error) {
    console.error("Lỗi fetch all artists:", error);
    return {};
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

// GET /api/artists/:id (Detail artist)
export async function fetchArtistById(artistId) {
  try {
    const response = await httpRequest.get(`artists/${artistId}`); // GET method.
    return response || {};
  } catch (error) {
    console.error("Lỗi fetch Artist By ID:", error);
    return {};
  }
}

// GET /api/artists/:id/tracks/popular
export async function fetchArtistPopularTracks(artistId) {
  try {
    const response = await httpRequest.get(
      `artists/${artistId}/tracks/popular`
    );
    return response || {};
  } catch (error) {
    console.error("Lỗi fetch artist popular tracks: ", error);
    return {};
  }
}

// GET /api/artist/:id/albums
export async function fetchArtistAlbums(artistId) {
  try {
    const response = await httpRequest.get(`artists/${artistId}/albums`);
    console.log(response);
    return response || {};
  } catch (error) {
    console.error("Lỗi fetch artist albums:", error);
    return {};
  }
}

// POST /api/artists (create new artist)
export async function createArtist(artistData) {
  try {
    const response = await httpRequest.post(`artists`, artistData);
    return response.artists || response;
  } catch (error) {
    console.error("Lỗi create artist:", error);
    throw error;
  }
}
