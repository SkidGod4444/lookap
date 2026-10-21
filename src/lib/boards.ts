import "server-only";
import { Redis } from "@upstash/redis";
import { bySlug } from "@/lib/data";

/* Moodboards: a signed-in person's collections of entries. Free for every account.
   Upstash Redis, sets so adds and removes from two tabs never overwrite each other:
     boards:<user>            set of board ids
     board:<user>:<id>        hash { name, createdAt }
     boarditems:<user>:<id>   set of entry slugs (insertion order is not kept; the page sorts by catalog order) */

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const boardsReady = Boolean(URL_ && TOKEN);
let client: Redis | null = null;
const redis = () => (client ??= new Redis({ url: URL_!, token: TOKEN! }));

export const MAX_BOARDS = 30;
export const MAX_ITEMS = 200;
export const MAX_NAME = 40;

export type Board = { id: string; name: string; createdAt: string; slugs: string[] };

const K = {
  list: (u: string) => `boards:${u}`,
  board: (u: string, id: string) => `board:${u}:${id}`,
  items: (u: string, id: string) => `boarditems:${u}:${id}`,
};

const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const cleanName = (raw: unknown) => String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);

export async function listBoards(userId: string): Promise<Board[]> {
  const r = redis();
  const ids = await r.smembers(K.list(userId));
  if (!ids.length) return [];
  const boards = await Promise.all(ids.map(async (id) => {
    const [meta, slugs] = await Promise.all([r.hgetall<{ name: string; createdAt: string }>(K.board(userId, id)), r.smembers(K.items(userId, id))]);
    if (!meta) return null;
    return { id, name: meta.name, createdAt: meta.createdAt, slugs: slugs.filter((s) => bySlug(s)) };
  }));
  return boards.filter((b): b is Board => b !== null).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createBoard(userId: string, rawName: unknown): Promise<Board | { error: string; status: number }> {
  const name = cleanName(rawName);
  if (!name) return { error: "Give the moodboard a name.", status: 400 };
  const r = redis();
  if ((await r.scard(K.list(userId))) >= MAX_BOARDS) return { error: `${MAX_BOARDS} moodboards is the limit.`, status: 400 };
  const id = newId(), createdAt = new Date().toISOString();
  await r.hset(K.board(userId, id), { name, createdAt });
  await r.sadd(K.list(userId), id);
  return { id, name, createdAt, slugs: [] };
}

export async function renameBoard(userId: string, id: string, rawName: unknown) {
  const name = cleanName(rawName);
  if (!name) return { error: "Give the moodboard a name.", status: 400 };
  const r = redis();
  if (!(await r.sismember(K.list(userId), id))) return { error: "No such moodboard.", status: 404 };
  await r.hset(K.board(userId, id), { name });
  return { ok: true, name };
}

export async function deleteBoard(userId: string, id: string) {
  const r = redis();
  if (!(await r.sismember(K.list(userId), id))) return { error: "No such moodboard.", status: 404 };
  await Promise.all([r.srem(K.list(userId), id), r.del(K.board(userId, id)), r.del(K.items(userId, id))]);
  return { ok: true };
}

export async function addItem(userId: string, id: string, slug: string) {
  if (!bySlug(slug)) return { error: "No such entry.", status: 404 };
  const r = redis();
  if (!(await r.sismember(K.list(userId), id))) return { error: "No such moodboard.", status: 404 };
  if ((await r.scard(K.items(userId, id))) >= MAX_ITEMS) return { error: `${MAX_ITEMS} entries per moodboard is the limit.`, status: 400 };
  await r.sadd(K.items(userId, id), slug);
  return { ok: true };
}

export async function removeItem(userId: string, id: string, slug: string) {
  const r = redis();
  if (!(await r.sismember(K.list(userId), id))) return { error: "No such moodboard.", status: 404 };
  await r.srem(K.items(userId, id), slug);
  return { ok: true };
}
