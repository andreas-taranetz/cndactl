import * as readline from "readline";

import { findSession, findSpeaker, sessionsForSpeaker } from "../data/normalize.js";
import { type ConferenceData } from "../domain/types.js";
import { renderEventLinks, renderSessionDetail, renderSessionList, renderSpeakerDetail, renderSpeakerList } from "./format.js";

type InteractiveSeams = {
  question: (prompt: string) => Promise<string>;
  write: (line: string) => void;
};

let seamsOverride: InteractiveSeams | null = null;

export function setInteractiveSeamsForTests(seams: InteractiveSeams): void {
  seamsOverride = seams;
}

export function resetInteractiveSeamsForTests(): void {
  seamsOverride = null;
}

export async function runInteractiveMode(getData: () => Promise<ConferenceData>): Promise<void> {
  let question: (prompt: string) => Promise<string>;
  let write: (line: string) => void;
  let cleanup: () => void;
  let running = true;

  if (seamsOverride) {
    question = seamsOverride.question;
    write = seamsOverride.write;
    cleanup = () => {};
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on("close", () => {
      running = false;
    });

    question = (prompt: string) =>
      new Promise<string>((resolve) => {
        if (!running) { resolve(""); return; }
        rl.once("close", () => resolve(""));
        rl.question(prompt, (answer) => resolve(answer));
      });
    write = (line: string) => process.stdout.write(line + "\n");
    cleanup = () => rl.close();
  }

  write("Welcome to cndactl! Browse Cloud Native Days Austria from your terminal.");
  write("");

  while (running) {
    write("What would you like to explore?");
    write("  1  Sessions");
    write("  2  Speakers");
    write("  3  Links");
    write("  q  Quit");
    write("");

    const choice = (await question("> ")).trim().toLowerCase();
    if (!running) break;
    write("");

    switch (choice) {
      case "1":
      case "sessions":
        await handleSessions(getData, question, write);
        break;
      case "2":
      case "speakers":
        await handleSpeakers(getData, question, write);
        break;
      case "3":
      case "links":
        await handleLinks(getData, write);
        break;
      case "q":
      case "quit":
      case "exit":
        running = false;
        break;
      default:
        write(`Unknown option: '${choice}'. Enter 1, 2, 3, or q.`);
        write("");
    }
  }

  cleanup();
}

async function handleSessions(
  getData: () => Promise<ConferenceData>,
  question: (prompt: string) => Promise<string>,
  write: (line: string) => void
): Promise<void> {
  const data = await getData();
  write(renderSessionList(data.sessions));
  write("");

  const query = (await question("Enter a session ID or title for details, or press Enter to go back: ")).trim();
  write("");

  if (query) {
    const session = findSession(data, query);
    if (session) {
      write(renderSessionDetail(session));
    } else {
      write(`No session found for '${query}'.`);
    }
    write("");
  }
}

async function handleSpeakers(
  getData: () => Promise<ConferenceData>,
  question: (prompt: string) => Promise<string>,
  write: (line: string) => void
): Promise<void> {
  const data = await getData();
  write(renderSpeakerList(data.speakers));
  write("");

  const query = (await question("Enter a speaker ID or name for details, or press Enter to go back: ")).trim();
  write("");

  if (query) {
    const speaker = findSpeaker(data, query);
    if (speaker) {
      write(await renderSpeakerDetail(speaker, sessionsForSpeaker(data, speaker.id)));
    } else {
      write(`No speaker found for '${query}'.`);
    }
    write("");
  }
}

async function handleLinks(getData: () => Promise<ConferenceData>, write: (line: string) => void): Promise<void> {
  const data = await getData();
  write(renderEventLinks(data.eventLinks));
  write("");
}
