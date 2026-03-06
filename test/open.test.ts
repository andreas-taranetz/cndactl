import { describe, expect, it, vi } from "vitest";

const openMock = vi.fn();

vi.mock("open", () => ({
  default: openMock
}));

describe("openUrl", () => {
  it("delegates to the open package", async () => {
    const { openUrl } = await import("../src/platform/open.js");

    await openUrl("https://cloudnativedays.at/");

    expect(openMock).toHaveBeenCalledWith("https://cloudnativedays.at/");
  });
});