import { Command } from "commander";

import { findSpeaker } from "../data/normalize.js";
import { type ConferenceData, type EventLink } from "../domain/types.js";
import { openUrl } from "../platform/open.js";
import { hyperlink, renderEventLinks } from "./format.js";

export function registerLinkCommands(getCommand: Command, program: Command, getData: () => Promise<ConferenceData>): void {
  const getLinksCommand = getCommand
    .command("links")
    .alias("link")
    .description("List core conference links")
    .action(async () => {
      await listLinks(getData);
    });

  const openCommand = program.command("open").description("Open event or speaker links in the browser");

  const openEventCommand = openCommand
    .command("event")
    .description("Open an event link by id")
    .argument("<linkId>", "event link id")
    .action(async (linkId: string) => {
      const data = await getData();
      const link = findEventLink(data.eventLinks, linkId);

      if (!link) {
        throw new Error(`No event link found for '${linkId}'`);
      }

      await openUrl(link.url);
      console.log(`Opened ${hyperlink(link.label, link.url)}`);
    });

  const openTicketsCommand = openCommand
    .command("tickets")
    .description("Open the tickets page")
    .action(async () => {
      const data = await getData();
      const link = findEventLink(data.eventLinks, "tickets");

      if (!link) {
        throw new Error("Tickets link is not configured");
      }

      await openUrl(link.url);
      console.log(`Opened ${hyperlink(link.label, link.url)}`);
    });

  const openWebsiteCommand = openCommand
    .command("website")
    .description("Open the main conference website")
    .action(async () => {
      const data = await getData();
      const link = findEventLink(data.eventLinks, "website");

      if (!link) {
        throw new Error("Website link is not configured");
      }

      await openUrl(link.url);
      console.log(`Opened ${hyperlink(link.label, link.url)}`);
    });

  const openSpeakerCommand = openCommand
    .command("speaker")
    .description("Open a speaker link by speaker and link type")
    .argument("<speakerQuery>", "speaker id or partial name")
    .argument("<linkType>", "normalized link type such as linkedin, blog, or sessionize")
    .action(async (speakerQuery: string, linkType: string) => {
      const data = await getData();
      const speaker = findSpeaker(data, speakerQuery);

      if (!speaker) {
        throw new Error(`No speaker found for '${speakerQuery}'`);
      }

      const link = speaker.links.find((entry) => entry.type === normalizeLookup(linkType));

      if (!link) {
        throw new Error(`Speaker '${speaker.fullName}' has no '${linkType}' link`);
      }

      await openUrl(link.url);
      console.log(`Opened ${speaker.fullName} ${hyperlink(link.type, link.url)}`);
    });

  const linkExamples = ["cndactl get links"];
  const openExamples = ["cndactl open tickets", "cndactl open website", "cndactl open event venue", "cndactl open speaker \"Alex Example\" linkedin"];

  getLinksCommand.addHelpText("after", formatExamples(linkExamples));
  openCommand.addHelpText("after", formatExamples(openExamples));
  openEventCommand.addHelpText("after", formatExamples(["cndactl open event venue", "cndactl open event youtube"]));
  openTicketsCommand.addHelpText("after", formatExamples(["cndactl open tickets"]));
  openWebsiteCommand.addHelpText("after", formatExamples(["cndactl open website"]));
  openSpeakerCommand.addHelpText("after", formatExamples(["cndactl open speaker \"Alex Example\" linkedin", "cndactl open speaker example-speaker-id sessionize"]));
}

async function listLinks(getData: () => Promise<ConferenceData>): Promise<void> {
  const data = await getData();
  console.log(renderEventLinks(data.eventLinks));
}

function findEventLink(links: EventLink[], query: string): EventLink | undefined {
  const normalized = normalizeLookup(query);
  return links.find((link) => normalizeLookup(link.id) === normalized || normalizeLookup(link.label) === normalized);
}

function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

function formatExamples(values: string[]): string {
  return `\nExamples:\n${values.map((value) => `  ${value}`).join("\n")}`;
}