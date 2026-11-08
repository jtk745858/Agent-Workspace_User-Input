import { expect, it } from "vitest";
import { isValidUserInput } from "../src/features/user-input/isValidUserInput";

it.each(["", "😀!!!", "1️⃣", "1\u20e3", "ℹ️", "\u0301"])("거부하는 입력 %j", (text) => {
  expect(isValidUserInput(text)).toBe(false);
});

it.each(["1️⃣2", "你好", "١٢", "Ⅳ", "e\u0301"])("허용하는 입력 %j", (text) => {
  expect(isValidUserInput(text)).toBe(true);
});
