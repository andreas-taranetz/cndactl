import { type RawSessionizeData } from "../src/domain/types.js";

export const sampleSessionizeData: RawSessionizeData = {
  sessions: [
    {
      id: "1119590",
      title: "Agentic AI Under Attack",
      description: "Live demos of agentic AI exploit paths.",
      startsAt: null,
      endsAt: null,
      isServiceSession: false,
      isPlenumSession: false,
      speakers: ["speaker-1"],
      roomId: null,
      liveUrl: null,
      recordingUrl: null,
      status: "Accepted",
      isInformed: true,
      isConfirmed: true
    }
  ],
  speakers: [
    {
      id: "speaker-1",
      firstName: "Alex",
      lastName: "Example",
      fullName: "Alex Example",
      bio: "Platform engineer and sample conference speaker.",
      tagLine: "Platform Engineer @ Example Labs",
      profilePicture: "https://example.com/alex.png",
      isTopSpeaker: false,
      links: [
        {
          title: "LinkedIn",
          url: "https://linkedin.example/alex",
          linkType: "LinkedIn"
        },
        {
          title: "Sessionize",
          url: "https://sessionize.example/alex",
          linkType: "Sessionize"
        }
      ],
      sessions: [1119590]
    }
  ],
  questions: [],
  categories: [],
  rooms: []
};