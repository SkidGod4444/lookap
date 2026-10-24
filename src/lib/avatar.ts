import HAVE from "./avatars.json";

/* A designer's profile picture by X handle. Most are kept with the site (public/avatars, made by
   scripts/build-avatars.ts), so a card shows one with no request to anyone; the rest go through the cached
   /api/avatar route. Shared by the server page (preload), the feed card and the client Avatar. */
const LOCAL = new Set<string>(HAVE as string[]);
export const hasLocalAvatar = (x: string) => LOCAL.has(x.toLowerCase());
export const avatarUrl = (x: string) => (hasLocalAvatar(x) ? `/avatars/${x.toLowerCase()}.webp` : `/api/avatar/${encodeURIComponent(x)}`);
