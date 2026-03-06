import { describe, expect, it } from "vitest";

import { normalizeConferenceData } from "../src/data/normalize.js";
import { renderSpeakerList } from "../src/commands/format.js";
import { sampleSessionizeData } from "./fixtures.js";

describe("speaker listing scope", () => {
  it("renders speakers from the Sessionize feed", () => {
    const data = normalizeConferenceData(sampleSessionizeData);
    const output = renderSpeakerList(data.speakers);

    expect(output).toContain("Alex Example");
  });
});