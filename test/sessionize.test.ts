import { describe, expect, it, vi } from "vitest";

import { fetchSessionizeData, SESSIONIZE_ALL_URL } from "../src/data/sessionize.js";
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