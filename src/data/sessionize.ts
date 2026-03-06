import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

import { type RawSessionizeData } from "../domain/types.js";

export const SESSIONIZE_EVENT_KEY = "7o54a33i";
export const SESSIONIZE_ALL_URL = `https://sessionize.com/api/v2/${SESSIONIZE_EVENT_KEY}/view/All`;
export const DEFAULT_SESSIONIZE_CACHE_TTL_MS = 30 * 60 * 1000;

type SessionizeCacheRecord = {
  cachedAt: string;
  payload: unknown;
};

type FetchSessionizeDataWithCacheOptions = {
  fetchImpl?: typeof fetch;
  cacheTtlMs?: number;
  cacheFilePath?: string | null;
  now?: () => number;
  readTextFile?: (path: string) => Promise<string>;
  writeTextFile?: (path: string, content: string) => Promise<void>;
  ensureDir?: (path: string) => Promise<void>;
};

export async function fetchSessionizeData(fetchImpl: typeof fetch = fetch): Promise<RawSessionizeData> {
  const response = await fetchImpl(SESSIONIZE_ALL_URL, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Sessionize request failed with status ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  assertSessionizeData(data);
  return data;
}

export async function fetchSessionizeDataWithCache(
  options: FetchSessionizeDataWithCacheOptions = {}
): Promise<RawSessionizeData> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_SESSIONIZE_CACHE_TTL_MS;
  const cacheFilePath = options.cacheFilePath === undefined ? getDefaultSessionizeCacheFilePath() : options.cacheFilePath;
  const now = options.now ?? Date.now;
  const readTextFile = options.readTextFile ?? ((path: string) => readFile(path, "utf8"));
  const writeTextFile = options.writeTextFile ?? ((path: string, content: string) => writeFile(path, content, "utf8"));
  const ensureDir =
    options.ensureDir ??
    (async (path: string) => {
      await mkdir(path, { recursive: true });
    });

  const cacheRead = await readCache(cacheFilePath, readTextFile);
  if (cacheRead && now() - cacheRead.cachedAtMs <= cacheTtlMs) {
    return cacheRead.data;
  }

  try {
    const fresh = await fetchSessionizeData(fetchImpl);
    await writeCache(cacheFilePath, fresh, now(), writeTextFile, ensureDir);
    return fresh;
  } catch (error) {
    if (cacheRead) {
      return cacheRead.data;
    }

    throw error;
  }
}

export function getDefaultSessionizeCacheFilePath(env: NodeJS.ProcessEnv = process.env): string | null {
  const home = homedir();
  if (!home) {
    return null;
  }

  const os = platform();
  const baseDir =
    env.XDG_CACHE_HOME ?? (os === "win32" ? env.LOCALAPPDATA ?? env.APPDATA ?? join(home, "AppData", "Local") : join(home, ".cache"));

  return join(baseDir, "cndactl", "sessionize-all.json");
}

export function resolveSessionizeCacheTtlMs(env: NodeJS.ProcessEnv = process.env): number {
  const value = env.CNDACTL_SESSIONIZE_CACHE_TTL_MINUTES;
  if (!value) {
    return DEFAULT_SESSIONIZE_CACHE_TTL_MS;
  }

  const parsedMinutes = Number(value);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return DEFAULT_SESSIONIZE_CACHE_TTL_MS;
  }

  return Math.round(parsedMinutes * 60 * 1000);
}

async function readCache(
  cacheFilePath: string | null,
  readTextFile: (path: string) => Promise<string>
): Promise<{ data: RawSessionizeData; cachedAtMs: number } | undefined> {
  if (!cacheFilePath) {
    return undefined;
  }

  try {
    const fileText = await readTextFile(cacheFilePath);
    const parsed = JSON.parse(fileText) as SessionizeCacheRecord;

    if (!isRecord(parsed) || typeof parsed.cachedAt !== "string") {
      return undefined;
    }

    const cachedAtMs = Date.parse(parsed.cachedAt);
    if (!Number.isFinite(cachedAtMs)) {
      return undefined;
    }

    assertSessionizeData(parsed.payload);
    return {
      data: parsed.payload,
      cachedAtMs
    };
  } catch {
    return undefined;
  }
}

async function writeCache(
  cacheFilePath: string | null,
  data: RawSessionizeData,
  cachedAtMs: number,
  writeTextFile: (path: string, content: string) => Promise<void>,
  ensureDir: (path: string) => Promise<void>
): Promise<void> {
  if (!cacheFilePath) {
    return;
  }

  try {
    await ensureDir(dirname(cacheFilePath));
    const payload: SessionizeCacheRecord = {
      cachedAt: new Date(cachedAtMs).toISOString(),
      payload: data
    };
    await writeTextFile(cacheFilePath, JSON.stringify(payload));
  } catch {
    // Caching is best-effort and must never break CLI usage.
  }
}

function assertSessionizeData(value: unknown): asserts value is RawSessionizeData {
  if (!isRecord(value)) {
    throw new Error("Sessionize payload is not an object");
  }

  if (!Array.isArray(value.sessions)) {
    throw new Error("Sessionize payload is missing sessions array");
  }

  if (!Array.isArray(value.speakers)) {
    throw new Error("Sessionize payload is missing speakers array");
  }

  if (!Array.isArray(value.rooms)) {
    throw new Error("Sessionize payload is missing rooms array");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}