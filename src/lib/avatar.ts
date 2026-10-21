/* The URL of a designer's cached profile picture, by X handle. Shared by the server page (preload) and the client Avatar. */
export const avatarUrl = (x: string) => `/api/avatar/${encodeURIComponent(x)}`;
