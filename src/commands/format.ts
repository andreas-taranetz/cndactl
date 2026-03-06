import pc from "picocolors";

import { type EventLink, type Session, type Speaker } from "../domain/types.js";

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

export function renderSpeakerDetail(speaker: Speaker, sessions: Session[]): string {
  const talkLines = sessions.length
    ? sessions.map((session) => `- ${session.title} (${session.id})`).join("\n")
    : "- No talks yet";
  const links = speaker.links.length
    ? speaker.links.map((link) => `- ${link.label} (${link.type}): ${link.url}`).join("\n")
    : "- No speaker links available";

  return [
    `${pc.bold(speaker.fullName)} (${pc.cyan(speaker.id)})`,
    speaker.tagLine || "",
    "",
    speaker.bio || "No bio available.",
    "",
    "Talks:",
    talkLines,
    "",
    "Links:",
    links
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
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