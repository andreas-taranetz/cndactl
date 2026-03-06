import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SESSIONIZE_EVENT_KEY = "7o54a33i";
const url = `https://sessionize.com/api/v2/${SESSIONIZE_EVENT_KEY}/view/All`;

console.log(`Fetching Sessionize data from ${url}...`);

const response = await fetch(url, {
  headers: { accept: "application/json" }
});

if (!response.ok) {
  throw new Error(`Sessionize request failed with status ${response.status}`);
}

const data = await response.json();

if (
  typeof data !== "object" ||
  data === null ||
  !Array.isArray(data.sessions) ||
  !Array.isArray(data.speakers) ||
  !Array.isArray(data.rooms)
) {
  throw new Error("Unexpected Sessionize response shape");
}

const outputPath = join(__dirname, "../src/data/sessionize-data.json");
writeFileSync(outputPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Sessionize data written to ${outputPath}`);
