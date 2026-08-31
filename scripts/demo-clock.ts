// Runs the CLI against a fake clock so recordings show the conference in full swing.
//
//   CNDACTL_DEMO_NOW   ISO timestamp the run starts at (default: the real time)
//   CNDACTL_DEMO_SPEED demo seconds per real second (default: 1)
//
// A speed above 1 lets a recording of `cndactl watch` show a progress bar filling up
// and a talk handing over to the next one within a few seconds.

const startedAt = Date.now();
const demoNow = process.env.CNDACTL_DEMO_NOW;
const demoSpeed = process.env.CNDACTL_DEMO_SPEED;

const base = demoNow ? Date.parse(demoNow) : startedAt;
if (!Number.isFinite(base)) {
  throw new Error(`Invalid CNDACTL_DEMO_NOW '${demoNow}', expected an ISO timestamp`);
}

const speed = demoSpeed === undefined ? 1 : Number(demoSpeed);
if (!Number.isFinite(speed) || speed <= 0) {
  throw new Error(`Invalid CNDACTL_DEMO_SPEED '${demoSpeed}', expected a positive number`);
}

const realNow = Date.now;
Date.now = () => base + (realNow() - startedAt) * speed;

await import("../src/cli.js");
