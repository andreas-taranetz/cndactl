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

export const scheduledSessionizeData: RawSessionizeData = {
  sessions: [
    {
      id: "2001",
      title: "Opening Keynote",
      description: "How the conference starts.",
      startsAt: "2026-09-29T07:00:00Z",
      endsAt: "2026-09-29T07:30:00Z",
      isServiceSession: false,
      isPlenumSession: false,
      speakers: ["speaker-1"],
      roomId: 11,
      liveUrl: null,
      recordingUrl: null,
      status: "Accepted",
      isInformed: true,
      isConfirmed: true
    },
    {
      id: "2002",
      title: "Platform Deep Dive",
      description: "Second slot in the main room.",
      startsAt: "2026-09-29T07:50:00Z",
      endsAt: "2026-09-29T08:20:00Z",
      isServiceSession: false,
      isPlenumSession: false,
      speakers: [],
      roomId: 11,
      liveUrl: null,
      recordingUrl: null,
      status: "Accepted",
      isInformed: true,
      isConfirmed: true
    },
    {
      id: "2003",
      title: "Parallel Track Talk",
      description: "Runs in the second room.",
      startsAt: "2026-09-29T07:50:00Z",
      endsAt: "2026-09-29T08:20:00Z",
      isServiceSession: false,
      isPlenumSession: false,
      speakers: [],
      roomId: 12,
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
      links: [],
      sessions: [2001]
    }
  ],
  questions: [],
  categories: [],
  rooms: [
    { id: 13, name: "Sponsor Area", sort: 0 },
    { id: 11, name: "Room 4", sort: 1 },
    { id: 12, name: "Room 6", sort: 2 }
  ]
};