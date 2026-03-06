import { type RawSessionizeData } from "../domain/types.js";
import config from "./sessionize-config.json" with { type: "json" };
import rawData from "./sessionize-data.json" with { type: "json" };

export const SESSIONIZE_EVENT_KEY = config.eventKey;
export const SESSIONIZE_ALL_URL = `https://sessionize.com/api/v2/${SESSIONIZE_EVENT_KEY}/view/All`;

function assertSessionizeData(value: unknown): asserts value is RawSessionizeData {
  if (typeof value !== "object" || value === null) {
    throw new Error("Embedded Sessionize data is not an object");
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record["sessions"])) {
    throw new Error("Embedded Sessionize data is missing sessions array");
  }
  if (!Array.isArray(record["speakers"])) {
    throw new Error("Embedded Sessionize data is missing speakers array");
  }
  if (!Array.isArray(record["rooms"])) {
    throw new Error("Embedded Sessionize data is missing rooms array");
  }
  if (!Array.isArray(record["questions"])) {
    throw new Error("Embedded Sessionize data is missing questions array");
  }
  if (!Array.isArray(record["categories"])) {
    throw new Error("Embedded Sessionize data is missing categories array");
  }
}

assertSessionizeData(rawData);
export const sessionizeData: RawSessionizeData = rawData;