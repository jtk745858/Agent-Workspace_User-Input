import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUserInput } from "../src/features/user-input/hooks/useUserInput";
import { isValidUserInput } from "../src/features/user-input/isValidUserInput";
import { createUserInputRequest, type UserInputRequest } from "../src/features/user-input/userInputRequest";

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const first = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
afterEach(() => vi.restoreAllMocks());

function setupHook() {
  const requests: UserInputRequest[] = [];
  const { result } = renderHook(() => useUserInput(text => {
    const request = createUserInputRequest(text);
    if (request) requests.push(request);
  }));
  const edit = (text: string) => act(() => result.current.setValue(text));
  const submit = () => act(() => result.current.handleSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>));
  return { result, requests, edit, submit };
}

describe("D-000 입력 상태", () => {
  it("DT-001 빈 초기값", () => expect(setupHook().result.current.value).toBe(""));
  it.each([
    ["DT-002 한글 입력", "한글"],
    ["DT-003 영문·숫자 입력", "abc123"],
    ["DT-004 기존 값 수정", "수정된 값"],
    ["DT-005 전체 삭제", ""],
  ])("%s", (_, text) => {
    const { result, edit } = setupHook();
    edit("이전 값");
    edit(text);
    expect(result.current.value).toBe(text);
    expect(result.current.isValid).toBe(text !== "");
  });
});

describe("D-001 스냅샷", () => {
  it("DT-006 A 제출", () => {
    const { edit, submit, requests } = setupHook();
    edit("A");
    submit();
    expect(requests[0].rawText).toBe("A");
  });
  it("DT-007 A 제출 후 B 편집", () => {
    const { edit, submit, requests } = setupHook();
    edit("A");
    submit();
    edit("B");
    expect(requests.map(r => r.rawText)).toEqual(["A"]);
  });
  it("DT-008 A와 B 연속 제출", () => {
    const { edit, submit, requests } = setupHook();
    edit("A");
    submit();
    edit("B");
    submit();
    expect(requests.map(r => r.rawText)).toEqual(["A", "B"]);
  });
  it("DT-009 제출 직전 수정", () => {
    const { edit, submit, requests } = setupHook();
    edit("초안");
    edit("최종");
    submit();
    expect(requests[0].rawText).toBe("최종");
  });
});

describe("D-002 원문", () => {
  it.each([
    ["DT-010 앞뒤 공백", "  Hello  "],
    ["DT-011 LF", "Hello\nWorld"],
    ["DT-012 CRLF", "Hello\r\nWorld"],
    ["DT-013 한글과 이모지", "안녕하세요 😀"],
    ["DT-014 분해형 결합 문자", "é"],
    ["DT-015 탭과 연속 공백", "\tA  B\t"],
  ])("%s", (_, text) => expect(createUserInputRequest(text)?.rawText).toBe(text));
});

describe("D-100 검증", () => {
  it.each([
    ["DT-016 \"\"", ""],
    ["DT-017 \"   \"", "   "],
    ["DT-018 \"\\t\\n\\r\"", "\t\n\r"],
    ["DT-019 \"!@#$%\"", "!@#$%"],
    ["DT-020 \"😀🔥👍\"", "😀🔥👍"],
    ["DT-021 \"👨‍👩‍👧‍👦\"", "👨‍👩‍👧‍👦"],
    ["DT-022 \"🇰🇷\"", "🇰🇷"],
    ["DT-023 \"1️⃣\"", "1️⃣"],
    ["DT-024 \"1⃣\"", "1⃣"],
    ["DT-025 \"😀!!!\"", "😀!!!"],
  ])("%s", (_, text) => expect(isValidUserInput(text)).toBe(false));
  it.each([
    ["DT-026 \"안녕하세요\"", "안녕하세요"],
    ["DT-027 \"Hello\"", "Hello"],
    ["DT-028 \"こんにちは\"", "こんにちは"],
    ["DT-029 \"漢字\"", "漢字"],
    ["DT-030 \"12345\"", "12345"],
    ["DT-031 \"1️⃣2\"", "1️⃣2"],
    ["DT-032 \"안녕하세요 😀\"", "안녕하세요 😀"],
    ["DT-033 \"Hello!!!\"", "Hello!!!"],
    ["DT-034 \"가나다\\nHello\"", "가나다\nHello"],
  ])("%s", (_, text) => expect(isValidUserInput(text)).toBe(true));

  const multi = "한".repeat(2730) + "ab";
  it.each([
    ["DT-035", "a".repeat(8191), 8191, true],
    ["DT-036", "a".repeat(8192), 8192, true],
    ["DT-037", "a".repeat(8193), 8193, false],
    ["DT-038", multi, 8192, true],
    ["DT-039", multi + "c", 8193, false],
  ] as const)("%s UTF-8 경계", (_, text, bytes, valid) => {
    expect(new TextEncoder().encode(text).byteLength).toBe(bytes);
    expect(isValidUserInput(text)).toBe(valid);
  });
  it.each([
    ["DT-040", "A\ud800", false],
    ["DT-041", "A\udc00", false],
    ["DT-042", "\ud801\udc00", true],
  ] as const)("%s surrogate", (_, text, valid) => expect(isValidUserInput(text)).toBe(valid));
});

describe("D-102 UUID", () => {
  it("DT-043 유효 제출에서 한 번 발급", () => {
    const uuid = vi.spyOn(crypto, "randomUUID").mockReturnValue(first);
    expect(createUserInputRequest("A")?.requestId).toBe(first);
    expect(uuid).toHaveBeenCalledTimes(1);
  });
  it("DT-044 UUID 형식", () => expect(createUserInputRequest("A")?.requestId).toMatch(uuidV4));
  it("DT-045 연속 제출에서 새 ID", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(first).mockReturnValueOnce(second);
    expect(["A", "A"].map(text => createUserInputRequest(text)?.requestId)).toEqual([first, second]);
  });
  it("DT-046 무효 입력은 ID 생성 전 차단", () => {
    const uuid = vi.spyOn(crypto, "randomUUID");
    expect(createUserInputRequest("1️⃣")).toBeNull();
    expect(uuid).not.toHaveBeenCalled();
  });
  it("DT-047 동일 요청 ID 유지", () => {
    const request = createUserInputRequest("A")!;
    const id = request.requestId;
    createUserInputRequest("B");
    expect(request).toEqual({ requestId: id, rawText: "A" });
  });
});

describe("D-101 요청", () => {
  it("DT-048 필수 값", () => expect(createUserInputRequest("A")).toEqual({ requestId: expect.stringMatching(uuidV4), rawText: "A" }));
  it("DT-049 필드 수", () => expect(Object.keys(createUserInputRequest("A")!).sort()).toEqual(["rawText", "requestId"]));
  it.each([["DT-050", " A "], ["DT-051", "A\nB"]])("%s 원문", (_, text) => expect(createUserInputRequest(text)?.rawText).toBe(text));
  it("DT-052 무효 요청", () => expect(createUserInputRequest("!!!")).toBeNull());
  it("DT-053 각 원문과 ID 연결", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValueOnce(first).mockReturnValueOnce(second);
    expect(["A", "B"].map(createUserInputRequest)).toEqual([{ requestId: first, rawText: "A" }, { requestId: second, rawText: "B" }]);
  });
});
