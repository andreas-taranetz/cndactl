import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_SESSIONIZE_CACHE_TTL_MS,
  fetchSessionizeData,
  fetchSessionizeDataWithCache,
  resolveSessionizeCacheTtlMs,
  SESSIONIZE_ALL_URL
} from "../src/data/sessionize.js";
import { sampleSessionizeData } from "./fixtures.js";

describe("fetchSessionizeData", () => {
  it("requests the Sessionize all endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleSessionizeData)
    });

    const data = await fetchSessionizeData(fetchImpl as typeof fetch);

    expect(data).toEqual(sampleSessionizeData);
    expect(fetchImpl).toHaveBeenCalledWith(SESSIONIZE_ALL_URL, {
      headers: {
        accept: "application/json"
      }
    });
  });

  it("throws on non-ok responses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    });

    await expect(fetchSessionizeData(fetchImpl as typeof fetch)).rejects.toThrow(
      "Sessionize request failed with status 503"
    );
  });

  it("validates that the payload is an object", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(null)
    });

    await expect(fetchSessionizeData(fetchImpl as typeof fetch)).rejects.toThrow(
      "Sessionize payload is not an object"
    );
  });

  it("validates required top-level arrays", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        sessions: [],
        speakers: []
      })
    });

    await expect(fetchSessionizeData(fetchImpl as typeof fetch)).rejects.toThrow(
      "Sessionize payload is missing rooms array"
    );
  });
});

describe("fetchSessionizeDataWithCache", () => {
  it("returns cached payload when cache is still fresh", async () => {
    const now = new Date("2026-03-06T10:00:00.000Z").getTime();
    const fetchImpl = vi.fn();

    const data = await fetchSessionizeDataWithCache({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => now,
      cacheTtlMs: 15 * 60 * 1000,
      cacheFilePath: "/tmp/cndactl-cache.json",
      readTextFile: async () =>
        JSON.stringify({
          cachedAt: new Date(now - 2 * 60 * 1000).toISOString(),
          payload: sampleSessionizeData
        }),
      writeTextFile: async () => {
        throw new Error("should not write on fresh cache");
      },
      ensureDir: async () => {
        throw new Error("should not create dir on fresh cache");
      }
    });

    expect(data).toEqual(sampleSessionizeData);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refetches data when cache is expired", async () => {
    const now = new Date("2026-03-06T10:00:00.000Z").getTime();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleSessionizeData)
    });
    const writeTextFile = vi.fn().mockResolvedValue(undefined);
    const ensureDir = vi.fn().mockResolvedValue(undefined);

    const data = await fetchSessionizeDataWithCache({
      fetchImpl: fetchImpl as typeof fetch,
      now: () => now,
      cacheTtlMs: 5 * 60 * 1000,
      cacheFilePath: "/tmp/cndactl-cache.json",
      readTextFile: async () =>
        JSON.stringify({
          cachedAt: new Date(now - 20 * 60 * 1000).toISOString(),
          payload: sampleSessionizeData
        }),
      writeTextFile,
      ensureDir
    });

    expect(data).toEqual(sampleSessionizeData);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(ensureDir).toHaveBeenCalledTimes(1);
    expect(writeTextFile).toHaveBeenCalledTimes(1);
  });

  it("falls back to stale cache when refetch fails", async () => {
    const now = new Date("2026-03-06T10:00:00.000Z").getTime();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    });

    const data = await fetchSessionizeDataWithCache({
      fetchImpl: fetchImpl as typeof fetch,
      now: () => now,
      cacheTtlMs: 5 * 60 * 1000,
      cacheFilePath: "/tmp/cndactl-cache.json",
      readTextFile: async () =>
        JSON.stringify({
          cachedAt: new Date(now - 20 * 60 * 1000).toISOString(),
          payload: sampleSessionizeData
        })
    });

    expect(data).toEqual(sampleSessionizeData);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns fresh data when cache write fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(sampleSessionizeData)
    });

    const data = await fetchSessionizeDataWithCache({
      fetchImpl: fetchImpl as typeof fetch,
      cacheFilePath: "/tmp/cndactl-cache.json",
      readTextFile: async () => {
        throw new Error("cache missing");
      },
      writeTextFile: async () => {
        throw new Error("disk full");
      },
      ensureDir: async () => undefined
    });

    expect(data).toEqual(sampleSessionizeData);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("resolveSessionizeCacheTtlMs", () => {
  it("uses default TTL when env var is missing", () => {
    expect(resolveSessionizeCacheTtlMs({})).toBe(DEFAULT_SESSIONIZE_CACHE_TTL_MS);
  });

  it("uses default TTL when env var is invalid", () => {
    expect(resolveSessionizeCacheTtlMs({ CNDACTL_SESSIONIZE_CACHE_TTL_MINUTES: "nope" })).toBe(
      DEFAULT_SESSIONIZE_CACHE_TTL_MS
    );
  });

  it("converts env minutes to milliseconds", () => {
    expect(resolveSessionizeCacheTtlMs({ CNDACTL_SESSIONIZE_CACHE_TTL_MINUTES: "10" })).toBe(600000);
  });
});