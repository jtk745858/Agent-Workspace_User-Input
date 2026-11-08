const encoder = new TextEncoder();
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const maxBytes = 8192;
const letterOrNumber = /[\p{L}\p{N}]/u;

// These are all Emoji 17.0 emoji-test.txt sequences containing a Letter or Number.
// Other emoji cannot satisfy letterOrNumber, including flags and ZWJ families.
const emojiWithLetterOrNumber = /[0-9]\uFE0F?\u20E3|\u2139\uFE0F?/gu;

export function isValidUserInput(value: string): boolean {
  if (/\p{Surrogate}/u.test(value) || encoder.encode(value).byteLength > maxBytes) return false;
  for (const { segment } of graphemes.segment(value)) {
    if (letterOrNumber.test(segment.replace(emojiWithLetterOrNumber, ""))) return true;
  }
  return false;
}
