import httpRequest from "../utils/httpRequest.js";

// GET /api/tracks (All, limit/offset)
export async function fetchTopTracks(limit = 10, offset = 0) {
  try {
    const response = await httpRequest.get(
      `tracks?limit=${limit}&offset=${offset}`
    );
    return response.tracks || [];
  } catch (error) {
    console.error("Lỗi fetch all tracks:", error.response?.error || error);
    return [];
  }
}

// GET /api/tracks/popular
export async function fetchPopularTracks(limit = 5) {
  try {
    const response = await httpRequest.get(`tracks/popular?limit=${limit}`);
    return response.data?.tracks || response.tracks || [];
  } catch (error) {
    console.error("Lỗi fetch popular tracks: ", error);
    return [];
  }
}

// GET /api/tracks/trending
export async function fetchTrendingTracks(limit = 5) {
  try {
    const response = await httpRequest.get(`tracks/trending?limit=${limit}`);
    return response.data?.tracks || response.tracks || [];
  } catch (error) {
    console.error("Lỗi fetch trending tracks: ", error);
    return [];
  }
}

// GET /api/tracks/:id
export async function fetchTracksById(trackId) {
  try {
    const response = await httpRequest.get(`tracks/${trackId}`);
    return response.data?.tracks || response.tracks || {};
  } catch (error) {
    console.error("Lỗi fetch tracks by ID:", error);
    return {};
  }
}

// POST /api/tracks/:id/play
export async function playTrack(trackId) {
  try {
    const response = await httpRequest.post(`tracks/${trackId}/play`, {});
    return response;
  } catch (error) {
    console.error("Lỗi play track:", error);
    throw error;
  }
}

// POST /api/tracks/ (create new track, body {name, artist,...})
export async function createTrackData(trackData) {
  try {
    const response = await httpRequest.post("track", trackData);
    return response;
  } catch (error) {
    console.error("Lỗi create track", error);
    throw error;
  }
}

// PUT /api/tracks/:id (update track data)
export async function updateTrack(trackId, trackData) {
  try {
    const response = await httpRequest.put(`tracks/${trackId}`, trackData);
    return response;
  } catch (error) {
    console.error("Lỗi update track:", error);
    throw error;
  }
}

// DELETE /api/tracks/:id (delete track)
export async function deleteTrack(trackId) {
  try {
    const response = await httpRequest.del(`tracks/${trackId}`);
    return true;
  } catch (error) {
    console.error("Lỗi delete track:", error);
    throw error;
  }
}

// POST /api/tracks/:id/like (like track)
export async function likeTrack(trackId) {
  try {
    const response = await httpRequest.post(`tracks/${trackId}/like`, {});
    return response;
  } catch (error) {
    console.error("Lỗi like track:", error);
    throw error;
  }
}

// DELETE /api/tracks/:id/like (unlike track)
export async function unlikeTrack(trackId) {
  try {
    await httpRequest.del(`tracks/${trackId}/like`);
    return true;
  } catch (error) {
    console.error("Lỗi unlike track:", error);
    throw error;
  }
}

// POST /api/tracks/:id/complete (complete play session, analytics)
export async function completeTrackPlay(trackId) {
  try {
    const response = await httpRequest.post(`track/${trackId}/complete`, {});
    return response;
  } catch (error) {
    console.error("Lỗi complete track play", error);
    throw error;
  }
}
