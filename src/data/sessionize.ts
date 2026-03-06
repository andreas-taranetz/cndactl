import { type RawSessionizeData } from "../domain/types.js";

export const SESSIONIZE_EVENT_KEY = "7o54a33i";
export const SESSIONIZE_ALL_URL = `https://sessionize.com/api/v2/${SESSIONIZE_EVENT_KEY}/view/All`;

export async function fetchSessionizeData(fetchImpl: typeof fetch = fetch): Promise<RawSessionizeData> {
  const response = await fetchImpl(SESSIONIZE_ALL_URL, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Sessionize request failed with status ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  assertSessionizeData(data);
  return data;
}

function assertSessionizeData(value: unknown): asserts value is RawSessionizeData {
  if (!isRecord(value)) {
    throw new Error("Sessionize payload is not an object");
  }

  if (!Array.isArray(value.sessions)) {
    throw new Error("Sessionize payload is missing sessions array");
  }

  if (!Array.isArray(value.speakers)) {
    throw new Error("Sessionize payload is missing speakers array");
  }

  if (!Array.isArray(value.rooms)) {
    throw new Error("Sessionize payload is missing rooms array");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}