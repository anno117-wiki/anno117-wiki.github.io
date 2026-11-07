export interface TextSegment {
  text: string
  /** URLの部分だけ値が入る。通常の文字は null */
  url: string | null
}

const URL_PATTERN = /https?:\/\/[^\s<>"'、。，．）」』】]+/g

/** 本文を「通常の文字」と「http(s)のURL」に分ける。HTMLは一切扱わない */
export function splitLinks(body: string): TextSegment[] {
  const segments: TextSegment[] = []
  let last = 0
  for (const match of body.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0
    if (start > last) segments.push({ text: body.slice(last, start), url: null })
    segments.push({ text: match[0], url: match[0] })
    last = start + match[0].length
  }
  if (last < body.length) segments.push({ text: body.slice(last), url: null })
  return segments
}
