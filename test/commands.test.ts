import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setRenderSpeakerImageAsciiForTests } from "../src/commands/format.js";
import { registerLinkCommands } from "../src/commands/links.js";
import { registerScheduleCommands } from "../src/commands/schedule.js";
import { registerSessionCommands } from "../src/commands/sessions.js";
import { registerSpeakerCommands } from "../src/commands/speakers.js";
import { normalizeConferenceData } from "../src/data/normalize.js";
import { type ConferenceData } from "../src/domain/types.js";
import { resetOpenImplementationForTests, setOpenImplementationForTests } from "../src/platform/open.js";
import { sampleSessionizeData, scheduledSessionizeData } from "./fixtures.js";

const openUrlMock = vi.fn();
const renderSpeakerImageAsciiMock = vi.fn<(_: string) => Promise<string>>();

describe("command registration", () => {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  const data = normalizeConferenceData(sampleSessionizeData);
  const scheduledData = normalizeConferenceData(scheduledSessionizeData);
  const duringKeynote = Date.parse("2026-09-29T07:10:00Z");

  beforeEach(() => {
    logSpy.mockClear();
    openUrlMock.mockReset();
    renderSpeakerImageAsciiMock.mockReset();
    renderSpeakerImageAsciiMock.mockResolvedValue("");
    setOpenImplementationForTests(openUrlMock);
    setRenderSpeakerImageAsciiForTests(renderSpeakerImageAsciiMock);
  });

  afterEach(() => {
    resetOpenImplementationForTests();
  });

  function createProgram(sourceData: ConferenceData = data, nowMs = Date.now()): Command {
    const program = new Command();
    const getCommand = program.command("get");
    const describeCommand = program.command("describe");
    const getData = vi.fn().mockResolvedValue(sourceData);

    registerSessionCommands(getCommand, describeCommand, getData);
    registerSpeakerCommands(getCommand, describeCommand, getData);
    registerLinkCommands(getCommand, program, getData);
    registerScheduleCommands(getCommand, program, getData, () => nowMs);

    return program;
  }

  it("lists sessions through the short alias", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "get", "sess"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Agentic AI Under Attack"));
  });

  it("describes a session by partial title", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "describe", "session", "agentic ai"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Agentic AI Under Attack"));
  });

  it("throws when a session is not found", async () => {
    const program = createProgram();

    await expect(program.parseAsync(["node", "test", "describe", "sess", "missing"])).rejects.toThrow(
      "No session found for 'missing'"
    );
  });

  it("lists speakers through the short alias", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "get", "spk"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Alex Example"));
  });

  it("describes a speaker by partial name", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "describe", "speaker", "alex"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Talks:"));
  });

  it("throws when a speaker is not found", async () => {
    const program = createProgram();

    await expect(program.parseAsync(["node", "test", "describe", "spk", "missing"])).rejects.toThrow(
      "No speaker found for 'missing'"
    );
  });

  it("shows the current talk per room", async () => {
    const program = createProgram(scheduledData, duringKeynote);

    await program.parseAsync(["node", "test", "get", "now"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Opening Keynote"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Parallel Track Talk"));
  });

  it("limits the current talks to one room", async () => {
    const program = createProgram(scheduledData, duringKeynote);

    await program.parseAsync(["node", "test", "get", "current", "--room", "6"]);

    const output = logSpy.mock.calls.at(-1)?.[0] as string;
    expect(output).toContain("Parallel Track Talk");
    expect(output).not.toContain("Opening Keynote");
  });

  it("throws when the room filter matches nothing", async () => {
    const program = createProgram(scheduledData, duringKeynote);

    await expect(program.parseAsync(["node", "test", "get", "now", "--room", "9"])).rejects.toThrow(
      "No room found for '9'"
    );
  });

  it("renders a single watch frame when output is not a terminal", async () => {
    const program = createProgram(scheduledData, duringKeynote);

    await program.parseAsync(["node", "test", "watch"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Opening Keynote"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Press Ctrl+C to exit."));
  });

  it("rejects a non-positive watch interval", async () => {
    const program = createProgram(scheduledData, duringKeynote);

    await expect(program.parseAsync(["node", "test", "watch", "--interval", "0"])).rejects.toThrow(
      "Invalid interval '0', expected a positive number of seconds"
    );
  });

  it("lists event links", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "get", "links"]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Tickets"));
  });

  it("opens an event link by normalized label", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "open", "event", " website "]);

    expect(openUrlMock).toHaveBeenCalledWith("https://cloudnativedays.at/");
    expect(logSpy).toHaveBeenCalledWith("Opened Website: https://cloudnativedays.at/");
  });

  it("throws when an event link is not found", async () => {
    const program = createProgram();

    await expect(program.parseAsync(["node", "test", "open", "event", "missing"])).rejects.toThrow(
      "No event link found for 'missing'"
    );
  });

  it("opens the tickets shortcut", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "open", "tickets"]);

    expect(openUrlMock).toHaveBeenCalledWith("https://tickets.cloudnativedays.at/");
  });

  it("throws when the website shortcut is unavailable", async () => {
    const program = createProgram({
      ...data,
      eventLinks: data.eventLinks.filter((link) => link.id !== "website")
    });

    await expect(program.parseAsync(["node", "test", "open", "website"])).rejects.toThrow(
      "Website link is not configured"
    );
  });

  it("opens a speaker link using normalized link type", async () => {
    const program = createProgram();

    await program.parseAsync(["node", "test", "open", "speaker", "alex", " LinkedIn "]);

    expect(openUrlMock).toHaveBeenCalledWith("https://linkedin.example/alex");
    expect(logSpy).toHaveBeenCalledWith("Opened Alex Example linkedin: https://linkedin.example/alex");
  });

  it("throws when a speaker link type is unavailable", async () => {
    const program = createProgram();

    await expect(program.parseAsync(["node", "test", "open", "speaker", "alex", "github"])).rejects.toThrow(
      "Speaker 'Alex Example' has no 'github' link"
    );
  });

  it("throws when opening a missing speaker", async () => {
    const program = createProgram();

    await expect(program.parseAsync(["node", "test", "open", "speaker", "missing", "linkedin"])).rejects.toThrow(
      "No speaker found for 'missing'"
    );
  });
});