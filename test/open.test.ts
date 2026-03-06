import { afterEach, describe, expect, it, vi } from "vitest";
import {
  openUrl,
  resetOpenImplementationForTests,
  setOpenImplementationForTests
} from "../src/platform/open.js";

describe("openUrl", () => {
  afterEach(() => {
    resetOpenImplementationForTests();
  });

  it("delegates to the open package", async () => {
    const openMock = vi.fn();
    setOpenImplementationForTests(openMock);

    await openUrl("https://cloudnativedays.at/");

    expect(openMock).toHaveBeenCalledWith("https://cloudnativedays.at/");
  });
});