#!/usr/bin/env node

import { Command } from "commander";

import { registerLinkCommands } from "./commands/links.js";
import { registerSessionCommands } from "./commands/sessions.js";
import { registerSpeakerCommands } from "./commands/speakers.js";
import { normalizeConferenceData } from "./data/normalize.js";
import { fetchSessionizeData, fetchSessionizeDataWithCache, resolveSessionizeCacheTtlMs } from "./data/sessionize.js";
import { type ConferenceData } from "./domain/types.js";
import packageJson from "../package.json" with { type: "json" };

let conferenceDataPromise: Promise<ConferenceData> | undefined;

const program = new Command();
const getCommand = new Command("get").description("List conference resources");
const describeCommand = new Command("describe").description("Show detailed resource information");
const examples = {
  root: ["cndactl get sessions", "cndactl describe speaker \"Alex Example\"", "cndactl open tickets"],
  get: ["cndactl get sessions", "cndactl get sess", "cndactl get speakers", "cndactl get spk", "cndactl get links"],
  describe: ["cndactl describe session 1119590", "cndactl describe sess 1119590", "cndactl describe speaker \"Alex Example\"", "cndactl describe spk example-speaker-id"]
};

program
  .name("cndactl")
  .description("Browse Cloud Native Days Austria from the terminal")
  .option("--no-cache", "Disable local cache and always fetch fresh data")
  .version(packageJson.version);

program.addHelpText("after", formatExamples(examples.root));
getCommand.addHelpText("after", formatExamples(examples.get));
describeCommand.addHelpText("after", formatExamples(examples.describe));

program.addCommand(getCommand);
program.addCommand(describeCommand);

registerSessionCommands(getCommand, describeCommand, getConferenceData);
registerSpeakerCommands(getCommand, describeCommand, getConferenceData);
registerLinkCommands(getCommand, program, getConferenceData);

program.showHelpAfterError();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}

async function getConferenceData(): Promise<ConferenceData> {
  conferenceDataPromise ??= loadConferenceData();
  return conferenceDataPromise;
}

async function loadConferenceData(): Promise<ConferenceData> {
  const options = program.opts<{ cache?: boolean }>();
  const rawDataPromise = options.cache === false
    ? fetchSessionizeData()
    : fetchSessionizeDataWithCache({
        cacheTtlMs: resolveSessionizeCacheTtlMs()
      });

  return rawDataPromise.then(normalizeConferenceData);
}

function formatExamples(values: string[]): string {
  return `\nExamples:\n${values.map((value) => `  ${value}`).join("\n")}`;
}