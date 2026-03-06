import { describe, expect, it } from "vitest";

import {
  renderEventLinks,
  renderSessionDetail,
  renderSessionList,
  renderSpeakerDetail,
  renderSpeakerList
} from "../src/commands/format.js";
import { normalizeConferenceData } from "../src/data/normalize.js";
import { sampleSessionizeData } from "./fixtures.js";

describe("command formatting", () => {
  it("renders session list output", () => {
    const data = normalizeConferenceData(sampleSessionizeData);
    const output = renderSessionList(data.sessions);

    expect(output).toContain("Agentic AI Under Attack");
    expect(output).toContain("schedule pending");
    expect(output).not.toContain("confirmed");
  });

  it("renders speaker detail with accepted talks", () => {
    const data = normalizeConferenceData(sampleSessionizeData);
    const speaker = data.speakers[0];
    const output = renderSpeakerDetail(speaker, data.sessions);

    expect(output).toContain("Talks:");
    expect(output).toContain("LinkedIn");
  });

  it("renders event links", () => {
    const data = normalizeConferenceData(sampleSessionizeData);
    const output = renderEventLinks(data.eventLinks);

    expect(output).toContain("Tickets");
    expect(output).toContain("https://cloudnativedays.at/");
  });

  it("renders empty states for lists", () => {
    expect(renderSessionList([])).toBe("No sessions found.");
    expect(renderSpeakerList([])).toBe("No speakers found.");
  });

  it("renders session detail with fallback values and media links", () => {
    const output = renderSessionDetail({
      id: "session-2",
      title: "Runtime Signals",
      description: "",
      startsAt: "2026-03-12T09:00:00Z",
      endsAt: "2026-03-12T09:45:00Z",
      room: null,
      status: "Accepted",
      isConfirmed: false,
      isInformed: true,
      liveUrl: "https://example.com/live",
      recordingUrl: "https://example.com/recording",
      speakers: []
    });

    expect(output).toContain("Unknown speaker");
    expect(output).toContain("No description available.");
    expect(output).toContain("room pending");
    expect(output).toContain("Live: https://example.com/live");
    expect(output).toContain("Recording: https://example.com/recording");
  });

  it("renders speaker detail fallbacks", () => {
    const output = renderSpeakerDetail(
      {
        id: "speaker-2",
        fullName: "Dana NoLinks",
        firstName: "Dana",
        lastName: "NoLinks",
        bio: "",
        tagLine: "",
        profilePicture: "",
        links: [],
        sessionIds: []
      },
      []
    );

    expect(output).toContain("No bio available.");
    expect(output).toContain("- No talks yet");
    expect(output).toContain("- No speaker links available");
  });
});