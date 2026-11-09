import { expect, it } from "vitest";
import { validateCoreResponse } from "../src/features/user-input/validateCoreResponse";

const request = { requestId: "local-id", rawText: "한글" };
const received = { requestId: request.requestId, status: "received", receivedText: request.rawText };
const rejected = { requestId: request.requestId, status: "rejected", errorCode: "INVALID_INPUT", message: "  입력 오류  " };
const invalid = { status: "error", code: "RESPONSE_INVALID" };

it.each([null, undefined, [], "received", {}, { ...received, status: "done" },
  { ...received, receivedText: 1 }, { ...received, requestId: null }, { ...received, status: false },
  { ...received, other: 1 }, { ...received, message: "no" }, { ...received, errorCode: "INVALID_INPUT" },
  { ...rejected, receivedText: "" }, { ...rejected, errorCode: "OTHER" }, { ...rejected, errorCode: 1 },
  { ...rejected, message: 1 }, { ...rejected, message: "" }, { ...rejected, message: " \t\n" },
  Object.create(received), { ...rejected, requestId: "other", message: "" },
])("O-000 invalid payload %#", response => {
  expect(validateCoreResponse(request, response)).toEqual(invalid);
});

for (const response of [received, rejected]) {
  it.each(Object.keys(response))(`O-000 ${response.status} missing %s`, field => {
    const partial = Object.fromEntries(Object.entries(response).filter(([key]) => key !== field));
    expect(validateCoreResponse(request, partial)).toEqual(invalid);
  });
  it(`O-001 ${response.status} exact ID required before comparing text`, () => {
    expect(validateCoreResponse({ requestId: "LOCAL-ID", rawText: "other" }, response))
      .toEqual({ status: "error", code: "RESPONSE_MISMATCH" });
  });
}
it.each(["INVALID_INPUT", "INVALID_REQUEST_ID", "INPUT_TOO_LONG"])("O-102 accepts %s", errorCode => {
  const response = { ...rejected, errorCode };
  expect(validateCoreResponse(request, response)).toEqual(response);
});
it.each(["한글", "Hello", "  한글  ", "A\nB", "A\r\nB", "한".normalize("NFD"), "A😀", "こんにちは漢字"])(
  "O-101 exact text %j", rawText => {
    const response = { ...received, receivedText: rawText };
    expect(validateCoreResponse({ ...request, rawText }, response)).toEqual(response);
  });
it.each([[" a ", "a"], ["A", "a"], ["A\r\nB", "A\nB"], ["한", "한".normalize("NFD")],
  ["A😀", "A"], ["漢字", "汉字"]])("O-001 distinguish %j from %j", (rawText, receivedText) => {
  expect(validateCoreResponse({ ...request, rawText }, { ...received, receivedText }))
    .toEqual({ status: "error", code: "RESPONSE_TEXT_MISMATCH" });
});
