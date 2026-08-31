import { describe, expect, it } from "vitest";

import { formatDuration, renderLiveFrame, renderProgressBar, renderRoomSchedules } from "../src/commands/format.js";
import { normalizeConferenceData } from "../src/data/normalize.js";
import { getRoomSchedules, getSessionProgress, resolveRoom } from "../src/domain/schedule.js";
import { scheduledSessionizeData } from "./fixtures.js";

const data = normalizeConferenceData(scheduledSessionizeData);
const duringKeynote = Date.parse("2026-09-29T07:10:00Z");
const betweenTalks = Date.parse("2026-09-29T07:40:00Z");
const afterConference = Date.parse("2026-09-29T09:00:00Z");

describe("room schedules", () => {
  it("keeps the room order from the feed and skips rooms without sessions", () => {
    expect(getRoomSchedules(data, duringKeynote).map((schedule) => schedule.room)).toEqual(["Room 4", "Room 6"]);
  });

  it("reports the running talk and the one after it", () => {
    const [roomFour, roomSix] = getRoomSchedules(data, duringKeynote);

    expect(roomFour.current?.title).toBe("Opening Keynote");
    expect(roomFour.next?.title).toBe("Platform Deep Dive");
    expect(roomSix.current).toBeNull();
    expect(roomSix.next?.title).toBe("Parallel Track Talk");
  });

  it("reports only upcoming talks in the gap between slots", () => {
    const [roomFour] = getRoomSchedules(data, betweenTalks);

    expect(roomFour.current).toBeNull();
    expect(roomFour.next?.title).toBe("Platform Deep Dive");
  });

  it("reports no talks once the schedule is over", () => {
    for (const schedule of getRoomSchedules(data, afterConference)) {
      expect(schedule.current).toBeNull();
      expect(schedule.next).toBeNull();
    }
  });

  it("filters by room", () => {
    expect(getRoomSchedules(data, duringKeynote, "Room 6").map((schedule) => schedule.room)).toEqual(["Room 6"]);
  });

  it("resolves rooms from partial and loosely written queries", () => {
    expect(resolveRoom(data, "6")).toBe("Room 6");
    expect(resolveRoom(data, " room4 ")).toBe("Room 4");
    expect(resolveRoom(data, "Room 4")).toBe("Room 4");
  });

  it("rejects unknown and ambiguous rooms", () => {
    expect(() => resolveRoom(data, "9")).toThrow("No room found for '9'. Available rooms: Room 4, Room 6");
    expect(() => resolveRoom(data, "room")).toThrow("Room 'room' is ambiguous");
  });

  it("computes progress for a running talk", () => {
    const [roomFour] = getRoomSchedules(data, duringKeynote);
    const progress = getSessionProgress(roomFour.current!, duringKeynote);

    expect(progress).toEqual({
      elapsedMs: 10 * 60_000,
      totalMs: 30 * 60_000,
      remainingMs: 20 * 60_000,
      ratio: 1 / 3
    });
  });

  it("clamps progress outside the talk window and rejects unscheduled talks", () => {
    const [roomFour] = getRoomSchedules(data, duringKeynote);

    expect(getSessionProgress(roomFour.current!, afterConference)?.ratio).toBe(1);
    expect(getSessionProgress({ ...roomFour.current!, endsAt: null }, duringKeynote)).toBeNull();
  });
});

describe("schedule formatting", () => {
  it("renders the running talk with its room, time and remaining minutes", () => {
    const output = renderRoomSchedules(getRoomSchedules(data, duringKeynote), duringKeynote);

    expect(output).toContain("Room 4");
    expect(output).toContain("NOW");
    expect(output).toContain("Opening Keynote");
    expect(output).toContain("Alex Example");
    expect(output).toContain("09:00–09:30 · 20m left");
    expect(output).toContain("09:50  Platform Deep Dive");
  });

  it("separates the running talk from the next one with an empty line", () => {
    const output = renderRoomSchedules(getRoomSchedules(data, duringKeynote, "Room 4"), duringKeynote);
    const lines = output.split("\n");

    expect(lines[lines.findIndex((line) => line.includes("NEXT")) - 1]).toBe("");
  });

  it("renders upcoming talks with a countdown", () => {
    const output = renderRoomSchedules(getRoomSchedules(data, betweenTalks, "Room 6"), betweenTalks);

    expect(output).toContain("NEXT");
    expect(output).toContain("Parallel Track Talk");
    expect(output).toContain("starts in 10m");
  });

  it("renders an empty state once the schedule is over", () => {
    const output = renderRoomSchedules(getRoomSchedules(data, afterConference), afterConference);

    expect(output).toContain("No more talks scheduled.");
    expect(renderRoomSchedules([], afterConference)).toBe("No scheduled sessions found.");
  });

  it("renders a live frame with clock, progress bar and exit hint", () => {
    const output = renderLiveFrame(getRoomSchedules(data, duringKeynote), duringKeynote);

    expect(output).toContain("Tue 29 Sep 09:10 Europe/Vienna");
    expect(output).toContain("█");
    expect(output).toContain("░");
    expect(output).toContain("20m left");
    expect(output).toContain("Press Ctrl+C to exit.");
  });

  it("omits session ids from both schedule views", () => {
    const schedules = getRoomSchedules(data, duringKeynote);

    for (const output of [renderRoomSchedules(schedules, duringKeynote), renderLiveFrame(schedules, duringKeynote)]) {
      expect(output).toContain("Opening Keynote");
      expect(output).not.toContain("2001");
    }
  });

  it("fills the progress bar proportionally", () => {
    expect(renderProgressBar(0, 4)).toContain("░░░░");
    expect(renderProgressBar(0.5, 4)).toContain("██");
    expect(renderProgressBar(1, 4)).toContain("████");
    expect(renderProgressBar(2, 4)).toContain("████");
  });

  it("formats durations from seconds up to days", () => {
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(18 * 60_000)).toBe("18m");
    expect(formatDuration(95 * 60_000)).toBe("1h 35m");
    expect(formatDuration(28.5 * 24 * 60 * 60_000)).toBe("28d 12h");
  });
});
