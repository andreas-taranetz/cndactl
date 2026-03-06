import { describe, expect, it } from "vitest";

import { findSession, findSpeaker, normalizeConferenceData, sessionsForSpeaker } from "../src/data/normalize.js";
import { sampleSessionizeData } from "./fixtures.js";

describe("normalizeConferenceData", () => {
  it("normalizes sessions", () => {
    const data = normalizeConferenceData(sampleSessionizeData);

    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0]?.id).toBe("1119590");
  });

  it("normalizes speakers", () => {
    const data = normalizeConferenceData(sampleSessionizeData);

    expect(data.speakers).toHaveLength(1);
    expect(data.speakers[0]?.id).toBe("speaker-1");
  });

  it("joins session speakers", () => {
    const data = normalizeConferenceData(sampleSessionizeData);

    expect(data.sessions[0]?.speakers[0]?.fullName).toBe("Alex Example");
  });

  it("finds sessions and speakers by partial query", () => {
    const data = normalizeConferenceData(sampleSessionizeData);

    expect(findSession(data, "agentic ai")?.id).toBe("1119590");
    expect(findSpeaker(data, "alex")?.id).toBe("speaker-1");
  });

  it("returns talks for a speaker", () => {
    const data = normalizeConferenceData(sampleSessionizeData);

    expect(sessionsForSpeaker(data, "speaker-1")).toHaveLength(1);
  });
});