import terminalImage from "terminal-image";

const SPEAKER_IMAGE_WIDTH = "35%";
const SPEAKER_IMAGE_HEIGHT = 18;
const SPEAKER_IMAGE_TIMEOUT_MS = 8000;

export async function renderSpeakerImageAscii(profilePictureUrl: string): Promise<string> {
  if (!profilePictureUrl.trim()) {
    return "";
  }

  try {
    const response = await fetch(profilePictureUrl, {
      signal: AbortSignal.timeout(SPEAKER_IMAGE_TIMEOUT_MS)
    });

    if (!response.ok) {
      return "";
    }

    const imageBuffer = new Uint8Array(await response.arrayBuffer());
    const rendered = await terminalImage.buffer(imageBuffer, {
      width: SPEAKER_IMAGE_WIDTH,
      height: SPEAKER_IMAGE_HEIGHT,
      preserveAspectRatio: true,
      preferNativeRender: true
    });

    return rendered.trimEnd();
  } catch {
    return "";
  }
}