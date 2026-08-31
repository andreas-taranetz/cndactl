import pc, { bold } from "picocolors";

import { EVENT_TIME_ZONE, getSessionProgress, type RoomSchedule, toMs } from "../domain/schedule.js";
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
    `Schedule: ${formatSchedule(session.startsAt, session.endsAt, session.room)}${session.startsAt ? pc.gray(` (${EVENT_TIME_ZONE})`) : ""}`,
    "Speakers:",
    speakers,
    "",
    wrapText(session.description || "No description available."),
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
    ? sessions
        .map((session) => `- ${session.title}\n  ${pc.gray(formatSchedule(session.startsAt, session.endsAt, session.room))}`)
        .join("\n")
    : "- No talks yet";
  const links = speaker.links.length
    ? speaker.links.map((link) => `- ${hyperlink(`${link.label} (${link.type})`, link.url)}`).join("\n")
    : "- No speaker links available";

  const headerBlock = [speakerImage, heading, subtitle].filter(Boolean).join("\n");

  return [
    headerBlock,
    "",
    wrapText(speaker.bio || "No bio available."),
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

const STATUS_LABEL_WIDTH = 6;
const STATUS_INDENT = " ".repeat(2 + STATUS_LABEL_WIDTH);

export function renderRoomSchedules(schedules: RoomSchedule[], nowMs: number): string {
  if (schedules.length === 0) {
    return "No scheduled sessions found.";
  }

  return schedules.map((schedule) => renderRoomSchedule(schedule, nowMs, false)).join("\n\n");
}

export function renderLiveFrame(schedules: RoomSchedule[], nowMs: number): string {
  const header = `${pc.bold("Cloud Native Days Austria")}  ${formatDay(nowMs)} ${formatClock(nowMs)} ${pc.gray(EVENT_TIME_ZONE)}`;
  const body = schedules.length
    ? schedules.map((schedule) => renderRoomSchedule(schedule, nowMs, true)).join("\n\n")
    : "No scheduled sessions found.";

  return [header, "", body, "", pc.gray("Press Ctrl+C to exit.")].join("\n");
}

export function renderProgressBar(ratio: number, width = 24): string {
  const filled = Math.round(Math.min(Math.max(ratio, 0), 1) * width);
  return `${pc.cyan("█".repeat(filled))}${pc.gray("░".repeat(width - filled))}`;
}

function renderRoomSchedule(schedule: RoomSchedule, nowMs: number, withProgress: boolean): string {
  const lines = [pc.bold(schedule.room)];

  if (schedule.current) {
    lines.push(...renderCurrentSession(schedule.current, nowMs, withProgress));

    if (schedule.next) {
      lines.push("", statusLine("NEXT", pc.gray, pc.gray(`${formatStart(schedule.next, nowMs)}  ${sessionTitle(schedule.next)}`)));
    }
  } else if (schedule.next) {
    lines.push(...renderUpcomingSession(schedule.next, nowMs));
  } else {
    lines.push(`  ${pc.gray("No more talks scheduled.")}`);
  }

  return lines.join("\n");
}

function renderCurrentSession(session: Session, nowMs: number, withProgress: boolean): string[] {
  const progress = getSessionProgress(session, nowMs);
  const remaining = progress ? `${formatDuration(progress.remainingMs)} left` : "";
  const timeRange = `${formatClock(session.startsAt!)}–${formatClock(session.endsAt!)}`;
  const lines = [
    statusLine("NOW", pc.green, sessionTitle(session)),
    `${STATUS_INDENT}${pc.gray(sessionSpeakers(session))}`
  ];

  if (withProgress && progress) {
    lines.push(`${STATUS_INDENT}${renderProgressBar(progress.ratio)} ${pc.gray(`${timeRange} · ${remaining}`)}`);
  } else {
    lines.push(`${STATUS_INDENT}${pc.gray([timeRange, remaining].filter(Boolean).join(" · "))}`);
  }

  return lines;
}

function renderUpcomingSession(session: Session, nowMs: number): string[] {
  const startsIn = `starts in ${formatDuration(toMs(session.startsAt) - nowMs)}`;
  const timeRange = `${formatStart(session, nowMs)}–${formatClock(session.endsAt!)}`;

  return [
    statusLine("NEXT", pc.yellow, sessionTitle(session)),
    `${STATUS_INDENT}${pc.gray(sessionSpeakers(session))}`,
    `${STATUS_INDENT}${pc.gray(`${timeRange} · ${startsIn}`)}`
  ];
}

function statusLine(label: string, color: (value: string) => string, text: string): string {
  return `  ${color(label.padEnd(STATUS_LABEL_WIDTH))}${text}`;
}

// Schedule views are for reading, not for picking up ids to pass to other commands.
function sessionTitle(session: Session): string {
  return truncate(session.title, availableWidth());
}

function sessionSpeakers(session: Session): string {
  const speakers = session.speakers.map((speaker) => speaker.fullName).join(", ") || "Unknown speaker";
  return truncate(speakers, availableWidth());
}

// Talks spanning into another conference day need the date to stay unambiguous.
function formatStart(session: Session, nowMs: number): string {
  const startsAt = session.startsAt!;
  const clock = formatClock(startsAt);
  return formatDay(startsAt) === formatDay(nowMs) ? clock : `${formatDay(startsAt)} ${clock}`;
}

// Terminals without a reported width (pipes, some pty wrappers) report 0 columns.
function availableWidth(): number {
  return Math.max((process.stdout.columns || 80) - STATUS_INDENT.length, 20);
}

function truncate(value: string, width: number): string {
  return value.length <= width ? value : `${value.slice(0, Math.max(width - 1, 1))}…`;
}

export function hyperlink(label: string, url: string): string {
  if (process.stdout.isTTY) {
    return `\x1b]8;;${url}\x1b\\${label}\x1b]8;;\x1b\\`;
  }
  return label === url ? url : `${label}: ${url}`;
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short"
});

const clockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatDay(timestamp: string | number): string {
  const parts = dayFormatter.formatToParts(new Date(timestamp));
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((entry) => entry.type === type)?.value ?? "";
  // en-GB renders September as "Sept"; three letters keep every day the same width.
  return `${part("weekday")} ${part("day")} ${part("month").slice(0, 3)}`;
}

export function formatClock(timestamp: string | number): string {
  return clockFormatter.format(new Date(timestamp));
}

export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.floor(durationMs / 60_000);

  if (totalMinutes < 1) {
    return `${Math.max(Math.floor(durationMs / 1000), 0)}s`;
  }

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

function formatSchedule(startsAt: string | null, endsAt: string | null, room: string | null): string {
  const time = startsAt && endsAt ? `${formatDay(startsAt)} · ${formatClock(startsAt)}–${formatClock(endsAt)}` : "schedule pending";
  const roomLabel = room ?? "room pending";
  return `${time} · ${roomLabel}`;
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

function wrapText(text: string, width = process.stdout.columns ?? 80): string {
  return text
    .split("\n")
    .map((paragraph) => {
      if (paragraph.length <= width) return paragraph;
      const words = paragraph.split(" ");
      const lines: string[] = [];
      let line = "";
      for (const word of words) {
        if (line.length + word.length + (line ? 1 : 0) > width) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = line ? `${line} ${word}` : word;
        }
      }
      if (line) lines.push(line);
      return lines.join("\n");
    })
    .join("\n");
}

function renderHeaderNextToImage(image: string, heading: string, subtitle: string): string {
  const indent = " ".repeat(INLINE_IMAGE_TEXT_INDENT);
  const subtitleLine = subtitle ? `\n${indent}${subtitle}` : "";
  return `${image}${indent}${heading}${subtitleLine}`;
}