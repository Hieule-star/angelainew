import { Download, Music } from 'lucide-react';

interface AudioAttachmentProps {
  url: string;
}

function getFilename(url: string): string {
  try {
    const u = new URL(url);
    const last = decodeURIComponent(u.pathname.split('/').pop() || 'audio.mp3');
    return last;
  } catch {
    return 'audio.mp3';
  }
}

export function AudioAttachment({ url }: AudioAttachmentProps) {
  const filename = getFilename(url);

  return (
    <div className="my-3 rounded-xl border border-angel-gold/30 bg-gradient-to-br from-angel-gold/5 to-angel-pink/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-angel-gold">
        <Music className="w-3.5 h-3.5" />
        <span className="truncate flex-1" title={filename}>{filename}</span>
      </div>
      <audio
        controls
        preload="metadata"
        src={url}
        className="w-full h-10"
      >
        Trình duyệt không hỗ trợ audio.
      </audio>
      <a
        href={url}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-angel-gold/80 hover:text-angel-gold transition-colors"
      >
        <Download className="w-3 h-3" />
        Tải về MP3
      </a>
    </div>
  );
}

/**
 * Extracts MP3 URLs from a text message and returns
 * { textWithoutAudio, audioUrls }
 */
export function extractAudioUrls(text: string): { cleanText: string; audioUrls: string[] } {
  const regex = /https?:\/\/[^\s<>"')]+\.mp3(?:\?[^\s<>"')]*)?/gi;
  const audioUrls: string[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const url = match[0];
    if (!seen.has(url)) {
      seen.add(url);
      audioUrls.push(url);
    }
  }
  const cleanText = text.replace(regex, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { cleanText, audioUrls };
}
