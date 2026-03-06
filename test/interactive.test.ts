import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setRenderSpeakerImageAsciiForTests } from "../src/commands/format.js";
import { resetInteractiveSeamsForTests, runInteractiveMode, setInteractiveSeamsForTests } from "../src/commands/interactive.js";
import { normalizeConferenceData } from "../src/data/normalize.js";
import { sampleSessionizeData } from "./fixtures.js";

describe("interactive mode", () => {
  const data = normalizeConferenceData(sampleSessionizeData);
  const getData = vi.fn().mockResolvedValue(data);

  const renderSpeakerImageAsciiMock = vi.fn<(_: string) => Promise<string>>();

  beforeEach(() => {
    getData.mockClear();
    renderSpeakerImageAsciiMock.mockReset();
    renderSpeakerImageAsciiMock.mockResolvedValue("");
    setRenderSpeakerImageAsciiForTests(renderSpeakerImageAsciiMock);
  });

  afterEach(() => {
    resetInteractiveSeamsForTests();
  });

  async function runWithInput(inputLines: string[]): Promise<string> {
    const answers = [...inputLines];
    const output: string[] = [];

    setInteractiveSeamsForTests({
      question: () => Promise.resolve(answers.shift() ?? "q"),
      write: (line) => output.push(line),
    });

    await runInteractiveMode(getData);

    return output.join("\n");
  }

  it("shows welcome message and menu on start", async () => {
    const out = await runWithInput(["q"]);
    expect(out).toContain("Welcome to cndactl!");
    expect(out).toContain("Sessions");
    expect(out).toContain("Speakers");
    expect(out).toContain("Links");
    expect(out).toContain("Quit");
  });

  it("quits when the user enters q", async () => {
    const out = await runWithInput(["q"]);
    expect(out).toContain("Welcome to cndactl!");
  });

  it("lists sessions when selecting option 1", async () => {
    const out = await runWithInput(["1", "", "q"]);
    expect(out).toContain("Agentic AI Under Attack");
  });

  it("accepts 'sessions' as an alias for option 1", async () => {
    const out = await runWithInput(["sessions", "", "q"]);
    expect(out).toContain("Agentic AI Under Attack");
  });

  it("shows session details when entering a matching query", async () => {
    const out = await runWithInput(["1", "agentic", "q"]);
    expect(out).toContain("Agentic AI Under Attack");
    expect(out).toContain("Live demos of agentic AI exploit paths.");
  });

  it("shows a not-found message for an unmatched session query", async () => {
    const out = await runWithInput(["1", "missing", "q"]);
    expect(out).toContain("No session found for 'missing'.");
  });

  it("lists speakers when selecting option 2", async () => {
    const out = await runWithInput(["2", "", "q"]);
    expect(out).toContain("Alex Example");
  });

  it("accepts 'speakers' as an alias for option 2", async () => {
    const out = await runWithInput(["speakers", "", "q"]);
    expect(out).toContain("Alex Example");
  });

  it("shows speaker details when entering a matching query", async () => {
    const out = await runWithInput(["2", "alex", "q"]);
    expect(out).toContain("Talks:");
    expect(out).toContain("Agentic AI Under Attack");
  });

  it("shows a not-found message for an unmatched speaker query", async () => {
    const out = await runWithInput(["2", "missing", "q"]);
    expect(out).toContain("No speaker found for 'missing'.");
  });

  it("lists links when selecting option 3", async () => {
    const out = await runWithInput(["3", "q"]);
    expect(out).toContain("Tickets");
    expect(out).toContain("Website");
  });

  it("accepts 'links' as an alias for option 3", async () => {
    const out = await runWithInput(["links", "q"]);
    expect(out).toContain("Tickets");
  });

  it("shows an error for an unknown menu option", async () => {
    const out = await runWithInput(["invalid", "q"]);
    expect(out).toContain("Unknown option: 'invalid'.");
  });
});
