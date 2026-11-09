const encoder = new TextEncoder();
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const maxBytes = 8192;
const letterOrNumber = /[\p{L}\p{N}]/u;

// These are all Emoji 17.0 emoji-test.txt sequences containing a Letter or Number.
// Other emoji cannot satisfy letterOrNumber, including flags and ZWJ families.
const emojiWithLetterOrNumber = /[0-9]\uFE0F?\u20E3|\u2139\uFE0F?/gu;

export function inputValidationMessage(value: string): string | undefined {
  if (/\p{Surrogate}/u.test(value)) return "올바르지 않은 유니코드 문자가 포함되어 있습니다.";
  if (encoder.encode(value).byteLength > maxBytes) return "입력을 UTF-8 기준 8,192바이트 이하로 줄여 주세요.";
  for (const { segment } of graphemes.segment(value)) {
    if (letterOrNumber.test(segment.replace(emojiWithLetterOrNumber, ""))) return undefined;
  }
  return "이모지 밖의 글자나 숫자를 하나 이상 입력해 주세요.";
}

export function isValidUserInput(value: string): boolean {
  return inputValidationMessage(value) === undefined;
}
