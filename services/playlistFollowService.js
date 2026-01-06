import httpRequest from "../utils/httpRequest";

// Follow a playlist (save to library)
export async function followPlaylist(playlistId) {
  try {
    const response = await httpRequest.post(
      `playlists/${playlistId}/follow`,
      {}
    );
    return response;
  } catch (error) {
    console.error("Error following playlist:", error);
    throw error;
  }
}

// Unfollow playlist (remove form library)
export async function unfollowPlaylist(playlistId) {
  try {
    const response = await httpRequest.del(`playlists/${playlistId}/follow`);
    return response;
  } catch (error) {
    console.error("Error unfollowing playlist:", error);
    throw error;
  }
}

// Check if user is following a playlist
export async function checkIfFollowingPlaylist(playlistId) {
  try {
    const response = await httpRequest.get(`me/playlists/followed`);
    const followedPlaylists = response.playlists || [];
    return followedPlaylists.some((playlist) => playlist.id === playlistId);
  } catch (error) {
    console.error("Error checking playlist follow status:", error);
    return false;
  }
}

// Get user's followed playlists
export async function getFollowedPlaylists(limit = 20, offset = 0) {
  try {
    const response = await httpRequest.get(
      `me/playlists/followed?limit=${limit}&offset=${offset}`
    );
    return response.playlists || [];
  } catch (error) {
    console.error("Error fetching followed playlists:", error);
    return [];
  }
}

// Create a new playlist
export async function createPlaylist(playlistData) {
  try {
    const response = await httpRequest.post("playlists", playlistData);
    return response;
  } catch (error) {
    console.error("Error creating playlist", error);
    throw error;
  }
}

// Get user's own playlists
export async function getMyPlaylists() {
  try {
    const response = await httpRequest.get("me/playlists");
    return response.playlists || [];
  } catch (error) {
    console.error("Error fetching my playlists:", error);
    return [];
  }
}
