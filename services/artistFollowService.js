import httpRequest from "../utils/httpRequest.js";

// Follow artist
export async function followArtist(artistId) {
  try {
    const response = await httpRequest.post(`artists/${artistId}/follow`, {});
    return response;
  } catch (error) {
    console.error("Error following artist:", error);
    throw error;
  }
}

// Unfollow Artist
export async function unfollowArtist(artistId) {
  try {
    const response = await httpRequest.del(`artists/${artistId}/follow`);
    return response;
  } catch (error) {
    console.error("Error unfollowing artist:", error);
    throw error;
  }
}

// Kiểm tra người dùng có đang theo giõi nghệ sĩ nào không
export async function checkIfFollowingArtist(artistId) {
  try {
    const response = await httpRequest.get("me/following");
    const followedArtists = response.artistId || [];
    return followedArtists.some((artist) => artist.id === artistId);
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}

// Gọi các nghệ sĩ được người dùng theo giõi
export async function getFollowedArtists(limit = 20, offset = 0) {
  try {
    const response = await httpRequest.get(
      `me/following?limit=${limit}&${offset}`
    );
    return response.artists || [];
  } catch (error) {
    console.error("Error fetching followed artists:", error);
    return [];
  }
}
