export type RawSessionizeData = {
  sessions: RawSession[];
  speakers: RawSpeaker[];
  questions: unknown[];
  categories: unknown[];
  rooms: RawRoom[];
};

export type RawSession = {
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  isServiceSession: boolean;
  isPlenumSession: boolean;
  speakers: string[];
  roomId: number | string | null;
  liveUrl: string | null;
  recordingUrl: string | null;
  status: string;
  isInformed: boolean;
  isConfirmed: boolean;
};

export type RawSpeakerLink = {
  title: string;
  url: string;
  linkType: string;
};

export type RawSpeaker = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string;
  tagLine: string;
  profilePicture: string;
  isTopSpeaker: boolean;
  links: RawSpeakerLink[];
  sessions: Array<number | string>;
};

export type RawRoom = {
  id: number | string;
  name: string;
};

export type SpeakerLink = {
  type: string;
  label: string;
  url: string;
};

export type Speaker = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  bio: string;
  tagLine: string;
  profilePicture: string;
  isTopSpeaker: boolean;
  links: SpeakerLink[];
  sessionIds: string[];
};

export type Session = {
  id: string;
  title: string;
  description: string;
  startsAt: string | null;
  endsAt: string | null;
  room: string | null;
  status: string;
  isConfirmed: boolean;
  isInformed: boolean;
  liveUrl: string | null;
  recordingUrl: string | null;
  speakers: Speaker[];
};

export type EventLink = {
  id: string;
  label: string;
  url: string;
  description: string;
};

export type ConferenceData = {
  sessions: Session[];
  speakers: Speaker[];
  eventLinks: EventLink[];
};