// The phone lost the line mid-request (LTE handover, an in-app browser put to sleep): Safari "Load failed" or
// "TypeError: network error", Chrome "Failed to fetch", Firefox "NetworkError". Not a bug on our side, so these
// are retried on the reader's screen and never counted in the owner's error list.
export const NET_ERROR = /load failed|failed to fetch|networkerror|network ?error|network request failed|network connection was lost|internet connection appears to be offline/i;
export const isNetError = (message: string) => NET_ERROR.test(message);
