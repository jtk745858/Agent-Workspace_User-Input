import { expect, it } from "vitest";
import { isValidUserInput } from "../src/features/user-input/isValidUserInput";
import cases from "./reception-content.json";

it.each(cases.valid)("D–R 공통 유효 입력 %j", text => expect(isValidUserInput(text)).toBe(true));
it.each(cases.invalid)("D–R 공통 무효 입력 %j", text => expect(isValidUserInput(text)).toBe(false));
