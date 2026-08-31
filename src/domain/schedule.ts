import { type ConferenceData, type Session } from "./types.js";

export const EVENT_TIME_ZONE = "Europe/Vienna";

export type RoomSchedule = {
  room: string;
  current: Session | null;
  next: Session | null;
};

export type SessionProgress = {
  elapsedMs: number;
  totalMs: number;
  remainingMs: number;
  ratio: number;
};

export function getRoomSchedules(data: ConferenceData, nowMs: number, roomFilter?: string): RoomSchedule[] {
  const rooms = roomFilter ? [resolveRoom(data, roomFilter)] : roomsWithSessions(data);

  return rooms.map((room) => {
    const scheduled = data.sessions
      .filter((session) => session.room === room && session.startsAt && session.endsAt)
      .sort((left, right) => left.startsAt!.localeCompare(right.startsAt!));

    return {
      room,
      current: scheduled.find((session) => isRunning(session, nowMs)) ?? null,
      next: scheduled.find((session) => toMs(session.startsAt) > nowMs) ?? null
    };
  });
}

export function resolveRoom(data: ConferenceData, query: string): string {
  const candidates = roomsWithSessions(data);
  const normalizedQuery = normalizeRoomName(query);
  const matches = candidates.filter((room) => normalizeRoomName(room).includes(normalizedQuery));

  if (matches.length === 0) {
    throw new Error(`No room found for '${query}'. Available rooms: ${candidates.join(", ")}`);
  }

  const exact = matches.find((room) => normalizeRoomName(room) === normalizedQuery);
  if (!exact && matches.length > 1) {
    throw new Error(`Room '${query}' is ambiguous. Did you mean: ${matches.join(", ")}?`);
  }

  return exact ?? matches[0];
}

export function getSessionProgress(session: Session, nowMs: number): SessionProgress | null {
  const startMs = toMs(session.startsAt);
  const endMs = toMs(session.endsAt);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }

  const totalMs = endMs - startMs;
  const elapsedMs = clamp(nowMs - startMs, 0, totalMs);

  return {
    elapsedMs,
    totalMs,
    remainingMs: totalMs - elapsedMs,
    ratio: elapsedMs / totalMs
  };
}

export function toMs(timestamp: string | null): number {
  return timestamp === null ? Number.NaN : Date.parse(timestamp);
}

function roomsWithSessions(data: ConferenceData): string[] {
  const scheduled = new Set(
    data.sessions.filter((session) => session.startsAt && session.endsAt).map((session) => session.room)
  );

  const known = data.rooms.map((room) => room.name).filter((room) => scheduled.has(room));
  const unknown = [...scheduled].filter((room): room is string => room !== null && !known.includes(room));

  return [...known, ...unknown];
}

function isRunning(session: Session, nowMs: number): boolean {
  return toMs(session.startsAt) <= nowMs && nowMs < toMs(session.endsAt);
}

function normalizeRoomName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
