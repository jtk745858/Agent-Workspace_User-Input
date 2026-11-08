// Remove emoji first because keycaps contain digits and some pictographs are letters.
const emoji = /[#*0-9]\uFE0F?\u20E3|[\p{Extended_Pictographic}\p{Emoji_Presentation}][\uFE0F\u200D\p{Emoji_Modifier}\u{E0020}-\u{E007F}]*/gu;

export function isValidUserInput(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value.replace(emoji, ""));
}
