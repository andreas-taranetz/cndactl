import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderEventLinks,
  resetRenderSpeakerImageAsciiForTests,
  renderSessionDetail,
  renderSessionList,
  renderSpeakerDetail,
  renderSpeakerList,
  setRenderSpeakerImageAsciiForTests
} from "../src/commands/format.js";
import { normalizeConferenceData } from "../src/data/normalize.js";
import { sampleSessionizeData } from "./fixtures.js";

const renderSpeakerImageAsciiMock = vi.fn<(_: string) => Promise<string>>();

describe("command formatting", () => {
  const originalIsTTY = process.stdout.isTTY;

  beforeEach(() => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true
    });
    delete process.env.SPEAKER_IMAGES;
    renderSpeakerImageAsciiMock.mockReset();
    setRenderSpeakerImageAsciiForTests(renderSpeakerImageAsciiMock);
  });

  afterEach(() => {
    resetRenderSpeakerImageAsciiForTests();
  });

  afterAll(() => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: originalIsTTY
    });
  });

  it("renders session list output", () => {
    const data = normalizeConferenceData(sampleSessionizeData);
    const output = renderSessionList(data.sessions);

    expect(output).toContain("Agentic AI Under Attack");
    expect(output).toContain("schedule pending");
    expect(output).not.toContain("confirmed");
  });

  it("renders speaker detail with accepted talks", async () => {
    renderSpeakerImageAsciiMock.mockResolvedValueOnce("ASCII_IMAGE");
    const data = normalizeConferenceData(sampleSessionizeData);
    const speaker = data.speakers[0];
    const output = await renderSpeakerDetail(speaker, data.sessions);

    expect(output).toContain("ASCII_IMAGE");
    expect(output).toContain("Talks:");
    expect(output).toContain("LinkedIn");
  });

  it("renders speaker heading below native inline image", async () => {
    renderSpeakerImageAsciiMock.mockResolvedValueOnce("\u001B]1337;File=abc\u0007");
    const data = normalizeConferenceData(sampleSessionizeData);
    const speaker = data.speakers[0];
    const output = await renderSpeakerDetail(speaker, data.sessions);

    expect(output).toContain("\u001B]1337;File=abc\u0007");
    expect(output).toMatch(/\u001B\]1337;File=abc\u0007\n(?:\u001B\[1m)?Alex Example/);
    expect(output).toContain("Platform Engineer @ Example Labs");
  });

  it("falls back to text when image rendering throws", async () => {
    renderSpeakerImageAsciiMock.mockRejectedValueOnce(new Error("image failed"));
    const data = normalizeConferenceData(sampleSessionizeData);
    const speaker = data.speakers[0];

    await expect(renderSpeakerDetail(speaker, data.sessions)).resolves.toContain("Alex Example");
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
    expect(output).toContain("Live");
    expect(output).toContain("https://example.com/live");
    expect(output).toContain("Recording");
    expect(output).toContain("https://example.com/recording");
  });

  it("renders speaker detail fallbacks", async () => {
    renderSpeakerImageAsciiMock.mockResolvedValueOnce("");
    const output = await renderSpeakerDetail(
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