import pc, { bold } from "picocolors";

import { type EventLink, type Session, type Speaker } from "../domain/types.js";
type RenderSpeakerImageAscii = (...args: any[]) => Promise<string>;

let cachedRenderSpeakerImageAscii: RenderSpeakerImageAscii | null = null;

export function setRenderSpeakerImageAsciiForTests(renderer: RenderSpeakerImageAscii): void {
  cachedRenderSpeakerImageAscii = renderer;
}

export function resetRenderSpeakerImageAsciiForTests(): void {
  cachedRenderSpeakerImageAscii = null;
}

async function renderSpeakerImageAscii(
	...args: Parameters<RenderSpeakerImageAscii>
): ReturnType<RenderSpeakerImageAscii> {
	if (!cachedRenderSpeakerImageAscii) {
		const module = await import("./speaker-image.js");
		cachedRenderSpeakerImageAscii = module.renderSpeakerImageAscii as RenderSpeakerImageAscii;
	}

	return cachedRenderSpeakerImageAscii(...args);
}


const INLINE_IMAGE_TEXT_INDENT = 42;

export function renderSessionList(sessions: Session[]): string {
  if (sessions.length === 0) {
    return "No sessions found.";
  }

  return sessions
    .map((session) => {
      const speakers = session.speakers.map((speaker) => speaker.fullName).join(", ") || "Unknown speaker";
      const schedule = formatSchedule(session.startsAt, session.endsAt, session.room);
      return `${pc.cyan(session.id)}  ${session.title}\n  ${speakers}\n  ${schedule}`;
    })
    .join("\n\n");
}

export function renderSessionDetail(session: Session): string {
  const speakers = session.speakers.map((speaker) => `- ${speaker.fullName}`).join("\n") || "- Unknown speaker";
  const links = [
    session.liveUrl ? hyperlink("Live", session.liveUrl) : null,
    session.recordingUrl ? hyperlink("Recording", session.recordingUrl) : null
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `${pc.bold(session.title)}`,
    `Schedule: ${formatSchedule(session.startsAt, session.endsAt, session.room)}`,
    "Speakers:",
    speakers,
    "",
    session.description || "No description available.",
    links ? `\n${links}` : ""
  ].join("\n");
}

export function renderSpeakerList(speakers: Speaker[]): string {
  if (speakers.length === 0) {
    return "No speakers found.";
  }

  const prefixLen = uniquePrefixLength(speakers.map((s) => s.id));
  return speakers
    .map((speaker) => {
      const name = speaker.isTopSpeaker ? pc.bold(speaker.fullName) : speaker.fullName;
      const star = speaker.isTopSpeaker ? `${pc.yellow("★")} ` : "  ";
      const subtitle = speaker.tagLine || "Speaker";
      const shortId = speaker.id.slice(0, prefixLen);
      return `${pc.cyan(shortId)}  ${star}${name}\n  ${pc.gray(subtitle)}`;
    })
    .join("\n\n");
}

export async function renderSpeakerDetail(speaker: Speaker, sessions: Session[]): Promise<string> {
  let speakerImage = "";

  // Only attempt to fetch/render speaker images in interactive terminals,
  // unless explicitly disabled via env var.
  if (process.stdout.isTTY && process.env.SPEAKER_IMAGES !== "0") {
    try {
      speakerImage = await renderSpeakerImageAscii(speaker.profilePicture);
    } catch {
      speakerImage = "";
    }
  }

  const heading = `${pc.bold(speaker.fullName)}`;
  const subtitle = speaker.tagLine || "";
  const talkLines = sessions.length
    ? sessions.map((session) => `- ${session.title}`).join("\n")
    : "- No talks yet";
  const links = speaker.links.length
    ? speaker.links.map((link) => `- ${hyperlink(`${link.label} (${link.type})`, link.url)}`).join("\n")
    : "- No speaker links available";

  const headerBlock = [speakerImage, heading, subtitle].filter(Boolean).join("\n");

  return [
    headerBlock,
    "",
    speaker.bio || "No bio available.",
    "",
    "Talks:",
    talkLines,
    "",
    "Links:",
    links
  ]
    .filter((line, index, lines) => !(line === "" && (index === 0 || lines[index - 1] === "")))
    .join("\n");
}

export function renderEventLinks(links: EventLink[]): string {
  return links.map((link) => `${pc.cyan(link.id)}  ${link.label}\n  ${link.description}\n  ${hyperlink(link.url, link.url)}`).join("\n\n");
}

export function hyperlink(label: string, url: string): string {
  if (process.stdout.isTTY) {
    return `\x1b]8;;${url}\x1b\\${label}\x1b]8;;\x1b\\`;
  }
  return label === url ? url : `${label}: ${url}`;
}

function formatSchedule(startsAt: string | null, endsAt: string | null, room: string | null): string {
  const time = startsAt && endsAt ? `${startsAt} - ${endsAt}` : "schedule pending";
  const roomLabel = room ?? "room pending";
  return `${time} | ${roomLabel}`;
}

function isNativeInlineImage(value: string): boolean {
  if (!value) {
    return false;
  }

  return value.includes("\u001B]1337;File=") || value.includes("\u001B_G");
}

function uniquePrefixLength(ids: string[]): number {
  for (let len = 4; len <= (ids[0]?.length ?? 0); len++) {
    if (new Set(ids.map((id) => id.slice(0, len))).size === ids.length) return len;
  }
  return ids[0]?.length ?? 0;
}

function renderHeaderNextToImage(image: string, heading: string, subtitle: string): string {
  const indent = " ".repeat(INLINE_IMAGE_TEXT_INDENT);
  const subtitleLine = subtitle ? `\n${indent}${subtitle}` : "";
  return `${image}${indent}${heading}${subtitleLine}`;
}