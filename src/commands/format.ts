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
    session.liveUrl ? `Live: ${session.liveUrl}` : null,
    session.recordingUrl ? `Recording: ${session.recordingUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  return [
    `${pc.bold(session.title)} (${pc.cyan(session.id)})`,
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

  return speakers
    .map((speaker) => {
      const subtitle = speaker.tagLine || "Speaker";
      return `${pc.cyan(speaker.id)}  ${speaker.fullName}\n  ${pc.gray(subtitle)}`;
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

  const heading = `${pc.bold(speaker.fullName)} (${pc.cyan(speaker.id)})`;
  const subtitle = speaker.tagLine || "";
  const talkLines = sessions.length
    ? sessions.map((session) => `- ${session.title} (${session.id})`).join("\n")
    : "- No talks yet";
  const links = speaker.links.length
    ? speaker.links.map((link) => `- ${link.label} (${link.type}): ${link.url}`).join("\n")
    : "- No speaker links available";

  const headerBlock = isNativeInlineImage(speakerImage)
    ? renderHeaderNextToImage(speakerImage, heading, subtitle)
    : [speakerImage, heading, subtitle].filter(Boolean).join("\n");

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
  return links.map((link) => `${pc.cyan(link.id)}  ${link.label}\n  ${link.description}\n  ${link.url}`).join("\n\n");
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

function renderHeaderNextToImage(image: string, heading: string, subtitle: string): string {
  const indent = " ".repeat(INLINE_IMAGE_TEXT_INDENT);
  const subtitleLine = subtitle ? `\n${indent}${subtitle}` : "";
  return `${image}${indent}${heading}${subtitleLine}`;
}