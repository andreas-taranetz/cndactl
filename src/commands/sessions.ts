import { Command } from "commander";

import { renderSessionDetail, renderSessionList } from "./format.js";
import { findSession } from "../data/normalize.js";
import { type ConferenceData } from "../domain/types.js";

export function registerSessionCommands(
  getCommand: Command,
  describeCommand: Command,
  getData: () => Promise<ConferenceData>
): void {
  const getSessionsCommand = getCommand
    .command("sessions")
    .alias("session")
    .description("List sessions")
    .action(async () => {
      await listSessions(getData);
    });

  const getSessCommand = getCommand
    .command("sess")
    .description("List sessions")
    .action(async () => {
      await listSessions(getData);
    });

  const describeSessionCommand = describeCommand
    .command("session")
    .alias("sessions")
    .description("Show one session by id or title")
    .argument("<query>", "session id or partial title")
    .action(async (query: string) => {
      await describeSession(getData, query);
    });

  const describeSessCommand = describeCommand
    .command("sess")
    .description("Show one session by id or title")
    .argument("<query>", "session id or partial title")
    .action(async (query: string) => {
      await describeSession(getData, query);
    });

  const listExamples = ["cndactl get sessions", "cndactl get sess"];
  const detailExamples = ["cndactl describe session 1119590", "cndactl describe sess 1119590"];

  getSessionsCommand.addHelpText("after", formatExamples(listExamples));
  getSessCommand.addHelpText("after", formatExamples(listExamples));
  describeSessionCommand.addHelpText("after", formatExamples(detailExamples));
  describeSessCommand.addHelpText("after", formatExamples(detailExamples));
}

async function listSessions(getData: () => Promise<ConferenceData>): Promise<void> {
  const data = await getData();
  console.log(renderSessionList(data.sessions));
}

async function describeSession(getData: () => Promise<ConferenceData>, query: string): Promise<void> {
  const data = await getData();
  const session = findSession(data, query);

  if (!session) {
    throw new Error(`No session found for '${query}'`);
  }

  console.log(renderSessionDetail(session));
}

function formatExamples(values: string[]): string {
  return `\nExamples:\n${values.map((value) => `  ${value}`).join("\n")}`;
}