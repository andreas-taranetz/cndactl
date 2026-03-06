import {
  type ConferenceData,
  type EventLink,
  type RawSessionizeData,
  type Session,
  type Speaker,
  type SpeakerLink
} from "../domain/types.js";

export const EVENT_LINKS: EventLink[] = [
  {
    id: "website",
    label: "Website",
    url: "https://cloudnativedays.at/",
    description: "Main conference website"
  },
  {
    id: "tickets",
    label: "Tickets",
    url: "https://tickets.cloudnativedays.at/",
    description: "Conference pass and ticket purchase page"
  },
  {
    id: "sessions",
    label: "Sessions",
    url: "https://cloudnativedays.at/sessions",
    description: "Public sessions page"
  },
  {
    id: "venue",
    label: "Venue",
    url: "https://maps.app.goo.gl/Q22METdvy3f1GFfx8",
    description: "Cineplexx Wienerberg, Vienna"
  },
  {
    id: "team",
    label: "Team",
    url: "https://cloudnativedays.at/team",
    description: "Organizer and team page"
  },
  {
    id: "youtube",
    label: "YouTube",
    url: "https://www.youtube.com/channel/UCs8vJuX9OkkXObKb5VCkYfA",
    description: "Recordings and channel"
  }
];

export function normalizeConferenceData(raw: RawSessionizeData): ConferenceData {
  const roomNames = new Map(raw.rooms.map((room) => [String(room.id), room.name]));

  const speakers = raw.speakers
    .map((speaker): Speaker => ({
      id: speaker.id,
      fullName: speaker.fullName,
      firstName: speaker.firstName,
      lastName: speaker.lastName,
      bio: speaker.bio?.trim() ?? "",
      tagLine: speaker.tagLine?.trim() ?? "",
      profilePicture: speaker.profilePicture,
      links: speaker.links.map(normalizeSpeakerLink),
      sessionIds: speaker.sessions.map((sessionId) => String(sessionId))
    }))
    .sort((left, right) => left.fullName.localeCompare(right.fullName));

  const speakerById = new Map(speakers.map((speaker) => [speaker.id, speaker]));

  const sessions = raw.sessions
    .map((session): Session => ({
      id: String(session.id),
      title: session.title,
      description: session.description?.trim() ?? "",
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      room: session.roomId === null ? null : roomNames.get(String(session.roomId)) ?? null,
      status: session.status,
      isConfirmed: session.isConfirmed,
      isInformed: session.isInformed,
      liveUrl: session.liveUrl,
      recordingUrl: session.recordingUrl,
      speakers: session.speakers
        .map((speakerId) => speakerById.get(speakerId))
        .filter((speaker): speaker is Speaker => speaker !== undefined)
    }))
    .sort(compareSessions);

  return {
    sessions,
    speakers,
    eventLinks: EVENT_LINKS
  };
}

export function findSpeaker(data: ConferenceData, query: string): Speaker | undefined {
  const normalizedQuery = normalizeQuery(query);
  return data.speakers.find((speaker) => {
    return speaker.id === query || normalizeQuery(speaker.fullName).includes(normalizedQuery);
  });
}

export function findSession(data: ConferenceData, query: string): Session | undefined {
  const normalizedQuery = normalizeQuery(query);
  return data.sessions.find((session) => {
    return session.id === query || normalizeQuery(session.title).includes(normalizedQuery);
  });
}

export function sessionsForSpeaker(data: ConferenceData, speakerId: string): Session[] {
  return data.sessions.filter((session) => session.speakers.some((speaker) => speaker.id === speakerId));
}

function normalizeSpeakerLink(link: { title: string; url: string; linkType: string }): SpeakerLink {
  return {
    type: normalizeLinkType(link.linkType),
    label: link.title,
    url: link.url
  };
}

function normalizeLinkType(linkType: string): string {
  return linkType.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function compareSessions(left: Session, right: Session): number {
  if (left.startsAt && right.startsAt) {
    const byTime = left.startsAt.localeCompare(right.startsAt);
    if (byTime !== 0) {
      return byTime;
    }
  }

  if (left.startsAt && !right.startsAt) {
    return -1;
  }

  if (!left.startsAt && right.startsAt) {
    return 1;
  }

  return left.title.localeCompare(right.title);
}