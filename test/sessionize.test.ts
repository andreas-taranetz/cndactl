import { describe, expect, it } from "vitest";

import { normalizeConferenceData } from "../src/data/normalize.js";
import { sessionizeData, SESSIONIZE_ALL_URL } from "../src/data/sessionize.js";

describe("sessionizeData", () => {
  it("exports a URL pointing to the Sessionize all endpoint", () => {
    expect(SESSIONIZE_ALL_URL).toMatch(/sessionize\.com\/api\/v2\/.+\/view\/All/);
  });

  it("has a sessions array", () => {
    expect(Array.isArray(sessionizeData.sessions)).toBe(true);
  });

  it("has a speakers array", () => {
    expect(Array.isArray(sessionizeData.speakers)).toBe(true);
  });

  it("has a rooms array", () => {
    expect(Array.isArray(sessionizeData.rooms)).toBe(true);
  });

  it("can be normalized into conference data", () => {
    const data = normalizeConferenceData(sessionizeData);
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(Array.isArray(data.speakers)).toBe(true);
  });
});