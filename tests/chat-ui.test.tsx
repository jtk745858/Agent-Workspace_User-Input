import { invoke } from "@tauri-apps/api/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MainPage from "../src/pages/MainPage";
import type { UserInputRequest } from "../src/features/user-input/userInputRequest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
const ipc = vi.mocked(invoke);
const turns = () => screen.queryAllByRole("listitem");
const edit = (value: string) => fireEvent.change(screen.getByRole("textbox"), { target: { value } });
const button = () => screen.getByRole("button", { name: "전송" });
const result = (row: HTMLElement) => row.querySelector(".chat-core .bubble");
const original = (row: HTMLElement) => row.querySelector(".chat-user .bubble");

function submit(text: string) {
  let resolve!: (payload: unknown) => void;
  let reject!: () => void;
  ipc.mockReturnValueOnce(new Promise((ok, fail) => { resolve = ok; reject = fail; }));
  edit(text);
  fireEvent.click(button());
  const { request } = ipc.mock.lastCall![1] as { request: UserInputRequest };
  const receipt = { status: "received", requestId: request.requestId, receivedText: request.rawText };
  return {
    receipt,
    finish: (payload: unknown = receipt) => act(async () => resolve(payload)),
    fail: () => act(async () => reject()),
  };
}

beforeEach(() => { ipc.mockReset(); vi.useFakeTimers(); render(<MainPage />); });
afterEach(() => vi.useRealTimers());

it("CHAT-01 shows the submitted user bubble immediately", () => {
  const a = submit("첫 요청");
  expect(turns()[0]).toHaveAttribute("data-request-id", a.receipt.requestId);
  expect(original(turns()[0])).toHaveTextContent("첫 요청");
  const editor = screen.getByRole<HTMLTextAreaElement>("textbox");
  expect(editor).toHaveFocus();
  expect([editor.selectionStart, editor.selectionEnd]).toEqual([0, editor.value.length]);
});
it("CHAT-02 shows the pending Core bubble", () => {
  submit("A");
  expect(result(turns()[0])).toHaveTextContent("Core 응답 대기 중");
});
it("CHAT-03 updates the same receipt node on success", async () => {
  const a = submit("A");
  const pending = result(turns()[0]);
  await a.finish();
  expect(result(turns()[0])).toBe(pending);
  expect(pending).toHaveTextContent("정상적으로 수신");
  expect(turns()).toHaveLength(1);
});
it("CHAT-04 preserves both turns with distinct IDs even for equal text", async () => {
  const a = submit("같음");
  await a.finish();
  const b = submit("같음");
  expect(turns().map(row => row.dataset.requestId)).toEqual([a.receipt.requestId, b.receipt.requestId]);
  expect(a.receipt.requestId).not.toBe(b.receipt.requestId);
  expect(result(turns()[0])).toHaveAttribute("data-kind", "received");
  expect(result(turns()[1])).toHaveAttribute("data-kind", "sending");
});
it.each([
  ["CHAT-05", "RESPONSE_MISMATCH"],
  ["CHAT-06", "RESPONSE_TEXT_MISMATCH"],
  ["CHAT-07", "RESPONSE_INVALID"],
] as const)("%s associates %s with the original submission", async (_, code) => {
  const a = submit("A");
  await a.finish();
  const b = submit("B");
  const responses = {
    RESPONSE_MISMATCH: a.receipt,
    RESPONSE_TEXT_MISMATCH: { ...b.receipt, receivedText: "A" },
    RESPONSE_INVALID: null,
  };
  await b.finish(responses[code]);
  expect(result(turns()[0])).toHaveAttribute("data-kind", "received");
  expect(result(turns()[1])).toHaveTextContent(code);
});
it("CHAT-08 shows verified rejection code and reason", async () => {
  const a = submit("A");
  await a.finish({ requestId: a.receipt.requestId, status: "rejected", errorCode: "INVALID_INPUT", message: "거부 사유" });
  expect(result(turns()[0])).toHaveTextContent(/INVALID_INPUT.*거부 사유/);
});
it("CHAT-09 shows communication error", async () => {
  await submit("A").fail();
  expect(result(turns()[0])).toHaveTextContent("IPC_ERROR");
});
it("CHAT-10 shows timeout only at deadline", () => {
  submit("A");
  act(() => vi.advanceTimersByTime(9999));
  expect(result(turns()[0])).toHaveAttribute("data-kind", "sending");
  act(() => vi.advanceTimersByTime(1));
  expect(result(turns()[0])).toHaveTextContent("RESPONSE_UNCONFIRMED");
});
it("CHAT-11 ignores late A during B and preserves both final receipts", async () => {
  const a = submit("A");
  act(() => vi.advanceTimersByTime(10000));
  const b = submit("B");
  await a.finish();
  expect(result(turns()[1])).toHaveAttribute("data-kind", "sending");
  await b.finish();
  expect(result(turns()[0])).toHaveTextContent("RESPONSE_UNCONFIRMED");
  expect(result(turns()[1])).toHaveAttribute("data-kind", "received");
});
it("CHAT-12 editing draft preserves snapshot", () => {
  submit("원문");
  edit("수정");
  expect(original(turns()[0])?.textContent).toBe("원문");
});
it("CHAT-13 preserves whitespace and Unicode", () => {
  const raw = "  한글\n e\u0301 😀 漢字  ";
  submit(raw);
  expect(original(turns()[0])?.textContent).toBe(raw);
});
it("CHAT-14 blocks duplicate sends and rows", () => {
  submit("A");
  fireEvent.submit(screen.getByRole<HTMLTextAreaElement>("textbox").form!);
  expect(ipc).toHaveBeenCalledTimes(1);
  expect(turns()).toHaveLength(1);
});
it("CHAT-15 keeps prior error after a successful retry", async () => {
  await submit("A").fail();
  await submit("B").finish();
  expect(result(turns()[0])).toHaveTextContent("IPC_ERROR");
  expect(result(turns()[1])).toHaveAttribute("data-kind", "received");
});
it("CHAT-16 invalid input creates no row or Core call", () => {
  edit("😀");
  fireEvent.submit(screen.getByRole<HTMLTextAreaElement>("textbox").form!);
  expect(turns()).toHaveLength(0);
  expect(ipc).not.toHaveBeenCalled();
});
it("CHAT-17 renders markup as text", () => {
  submit("<img src=x>");
  expect(original(turns()[0])?.textContent).toBe("<img src=x>");
  expect(within(turns()[0]).queryByRole("img")).toBeNull();
});
it("CHAT-18 keeps order and node identity across multiple exchanges", async () => {
  const nodes: HTMLElement[] = [];
  for (const text of ["하나", "둘", "셋", "넷"]) {
    const turn = submit(text);
    nodes.push(turns()[nodes.length]);
    await turn.finish();
  }
  expect(turns().map(row => original(row)?.textContent)).toEqual(["하나", "둘", "셋", "넷"]);
  turns().forEach((row, index) => expect(row).toBe(nodes[index]));
});
