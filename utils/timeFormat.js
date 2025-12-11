export function formatDuration(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const paddedSecs = secs.toString().padStart(2, "0");

  return `${mins}:${paddedSecs}`;
}

export function formatTrackDuration(seconds) {
  return formatDuration(seconds);
}
