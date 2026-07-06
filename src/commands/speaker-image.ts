import { Jimp } from "jimp";
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

    let imageBuffer = new Uint8Array(await response.arrayBuffer());

    // PNG images don't render correctly in some terminals via the native inline
    // image protocol — convert to JPEG first to ensure compatibility.
    if (isPng(imageBuffer)) {
      const img = await Jimp.fromBuffer(Buffer.from(imageBuffer));
      imageBuffer = new Uint8Array(await img.getBuffer("image/jpeg"));
    }

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

function isPng(buffer: Uint8Array): boolean {
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}