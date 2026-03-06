import { Command } from "commander";

import { findSpeaker, sessionsForSpeaker } from "../data/normalize.js";
import { type ConferenceData } from "../domain/types.js";
import { renderSpeakerDetail, renderSpeakerList } from "./format.js";

export function registerSpeakerCommands(
  getCommand: Command,
  describeCommand: Command,
  getData: () => Promise<ConferenceData>
): void {
  const getSpeakersCommand = getCommand
    .command("speakers")
    .alias("speaker")
    .description("List speakers")
    .action(async () => {
      await listSpeakers(getData);
    });

  const getSpkCommand = getCommand
    .command("spk")
    .description("List speakers")
    .action(async () => {
      await listSpeakers(getData);
    });

  const describeSpeakerCommand = describeCommand
    .command("speaker")
    .alias("speakers")
    .description("Show one speaker by id or name")
    .argument("<query>", "speaker id or partial name")
    .action(async (query: string) => {
      await describeSpeaker(getData, query);
    });

  const describeSpkCommand = describeCommand
    .command("spk")
    .description("Show one speaker by id or name")
    .argument("<query>", "speaker id or partial name")
    .action(async (query: string) => {
      await describeSpeaker(getData, query);
    });

  const listExamples = ["cndactl get speakers", "cndactl get spk"];
  const detailExamples = [
    'cndactl describe speaker "Alex Example"',
    'cndactl describe spk example-speaker-id'
  ];

  getSpeakersCommand.addHelpText("after", formatExamples(listExamples));
  getSpkCommand.addHelpText("after", formatExamples(listExamples));
  describeSpeakerCommand.addHelpText("after", formatExamples(detailExamples));
  describeSpkCommand.addHelpText("after", formatExamples(detailExamples));
}

async function listSpeakers(getData: () => Promise<ConferenceData>): Promise<void> {
  const data = await getData();
  console.log(renderSpeakerList(data.speakers));
}

async function describeSpeaker(getData: () => Promise<ConferenceData>, query: string): Promise<void> {
  const data = await getData();
  const speaker = findSpeaker(data, query);

  if (!speaker) {
    throw new Error(`No speaker found for '${query}'`);
  }

  console.log(await renderSpeakerDetail(speaker, sessionsForSpeaker(data, speaker.id)));
}

function formatExamples(values: string[]): string {
  return `\nExamples:\n${values.map((value) => `  ${value}`).join("\n")}`;
}