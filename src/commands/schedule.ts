import { Command } from "commander";

import { renderLiveFrame, renderRoomSchedules } from "./format.js";
import { getRoomSchedules } from "../domain/schedule.js";
import { type ConferenceData } from "../domain/types.js";

const ENTER_ALT_SCREEN = "\u001B[?1049h";
const LEAVE_ALT_SCREEN = "\u001B[?1049l";
const HIDE_CURSOR = "\u001B[?25l";
const SHOW_CURSOR = "\u001B[?25h";
const CLEAR_SCREEN = "\u001B[2J\u001B[H";

const DEFAULT_INTERVAL_SECONDS = "1";
const MIN_INTERVAL_MS = 100;

type ScheduleOptions = {
  room?: string;
};

type WatchOptions = ScheduleOptions & {
  interval: string;
};

export function registerScheduleCommands(
  getCommand: Command,
  program: Command,
  getData: () => Promise<ConferenceData>,
  now: () => number = Date.now
): void {
  const getNowCommand = getCommand
    .command("now")
    .alias("current")
    .description("Show the current or upcoming talk for every room")
    .option("-r, --room <room>", "limit the output to one room, e.g. \"Room 4\" or 4")
    .action(async (options: ScheduleOptions) => {
      const data = await getData();
      const nowMs = now();
      console.log(renderRoomSchedules(getRoomSchedules(data, nowMs, options.room), nowMs));
    });

  const watchCommand = program
    .command("watch")
    .description("Live view of the current talk per room with a progress bar")
    .option("-r, --room <room>", "limit the view to one room, e.g. \"Room 4\" or 4")
    .option("-i, --interval <seconds>", "refresh interval in seconds", DEFAULT_INTERVAL_SECONDS)
    .action(async (options: WatchOptions) => {
      await watchSchedule(getData, options, now);
    });

  getNowCommand.addHelpText("after", formatExamples(["cndactl get now", "cndactl get now --room \"Room 4\"", "cndactl get current -r 6"]));
  watchCommand.addHelpText("after", formatExamples(["cndactl watch", "cndactl watch --room 4", "cndactl watch --interval 5"]));
}

async function watchSchedule(
  getData: () => Promise<ConferenceData>,
  options: WatchOptions,
  now: () => number
): Promise<void> {
  const data = await getData();
  const intervalMs = parseIntervalMs(options.interval);
  const renderFrame = (): string => {
    const nowMs = now();
    return renderLiveFrame(getRoomSchedules(data, nowMs, options.room), nowMs);
  };

  // Renders once when output is piped or redirected, where a repainting view is meaningless.
  if (!process.stdout.isTTY) {
    console.log(renderFrame());
    return;
  }

  let restored = false;
  const restore = (): void => {
    if (restored) {
      return;
    }
    restored = true;
    process.stdout.write(SHOW_CURSOR + LEAVE_ALT_SCREEN);
  };

  process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);
  process.once("exit", restore);

  await new Promise<void>((resolve) => {
    const draw = (): void => {
      process.stdout.write(`${CLEAR_SCREEN}${renderFrame()}\n`);
    };

    const timer = setInterval(draw, intervalMs);
    const stop = (): void => {
      clearInterval(timer);
      restore();
      resolve();
    };

    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    draw();
  });
}

function parseIntervalMs(value: string): number {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`Invalid interval '${value}', expected a positive number of seconds`);
  }

  return Math.max(Math.round(seconds * 1000), MIN_INTERVAL_MS);
}

function formatExamples(values: string[]): string {
  return `\nExamples:\n${values.map((value) => `  ${value}`).join("\n")}`;
}
