import { invoke } from "@tauri-apps/api/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import MainPage from "../src/pages/MainPage";
import type { UserInputRequest } from "../src/features/user-input/userInputRequest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
const ipc = vi.mocked(invoke);
const success = "Core가 사용자 입력을 정상적으로 수신했습니다.";
const input = () => screen.getByRole<HTMLTextAreaElement>("textbox");
const button = () => screen.getByRole("button", { name: "전송" });
const notice = () => screen.getByRole("status");
const edit = (value: string) => fireEvent.change(input(), { target: { value } });

function submit(rawText: string) {
  let resolve!: (response: unknown) => void;
  let reject!: (reason: Error) => void;
  ipc.mockReturnValueOnce(new Promise((ok, fail) => { resolve = ok; reject = fail; }));
  edit(rawText);
  fireEvent.click(button());
  const { request } = ipc.mock.lastCall![1] as { request: UserInputRequest };
  const received = { requestId: request.requestId, status: "received", receivedText: rawText };
  return { received, resolve, reject };
}

beforeEach(() => { ipc.mockReset(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

it("O-100/101 shows submitted text literally and waits for the matching receipt", async () => {
  render(<MainPage />);
  const rawText = "  한글 😀\n<img src=x>  ";
  const pending = submit(rawText);
  const snapshot = screen.getByText((_, el) => el?.tagName === "P" && el.textContent === rawText);
  expect(snapshot.querySelector("img")).toBeNull();
  expect(notice()).toHaveTextContent("Core 응답 대기 중");
  expect(notice()).not.toHaveTextContent(success);
  edit("수정");
  await act(async () => pending.resolve(pending.received));
  expect(notice()).toHaveTextContent(success);
  expect(snapshot.textContent).toBe(rawText);
  expect(input()).toHaveValue("수정");
});

it.each(["INVALID_INPUT", "INVALID_REQUEST_ID", "INPUT_TOO_LONG"])("O-102 confirmed refusal %s", async errorCode => {
  render(<MainPage />);
  const pending = submit("A");
  await act(async () => pending.resolve({
    status: "rejected", requestId: pending.received.requestId, errorCode, message: "Core 상세 사유",
  }));
  expect(notice()).toHaveTextContent("Core 입력 거부");
  expect(notice()).toHaveTextContent(errorCode);
  expect(notice()).toHaveTextContent("Core 상세 사유");
  expect(notice()).not.toHaveTextContent(success);
  expect(button()).toBeEnabled();
});

it.each(["RESPONSE_INVALID", "RESPONSE_MISMATCH", "RESPONSE_TEXT_MISMATCH", "IPC_ERROR"])(
  "O-103 displays %s and allows a fresh submission", async code => {
    render(<MainPage />);
    const pending = submit("A");
    await act(async () => {
      switch (code) {
        case "IPC_ERROR": return pending.reject(new Error("failed"));
        case "RESPONSE_INVALID": return pending.resolve({ status: "rejected", message: "노출 금지" });
        case "RESPONSE_MISMATCH": return pending.resolve({ ...pending.received, requestId: "other" });
        default: return pending.resolve({ ...pending.received, receivedText: "other" });
      }
    });
    expect(notice()).toHaveTextContent(code);
    expect(notice()).not.toHaveTextContent(/정상적으로 수신|Core 입력 거부|노출 금지/);
    expect(input()).toHaveValue("A");
    expect(button()).toBeEnabled();
    const next = submit("B");
    await act(async () => next.resolve(next.received));
    expect(notice()).toHaveTextContent(success);
  });

it("O-103 timeout releases submission and ignores A after B succeeds", async () => {
  render(<MainPage />);
  const a = submit("A");
  act(() => vi.advanceTimersByTime(10_000));
  expect(notice()).toHaveTextContent("RESPONSE_UNCONFIRMED");
  expect(notice()).not.toHaveTextContent(success);
  const b = submit("B");
  await act(async () => b.resolve(b.received));
  await act(async () => a.resolve(null));
  expect(notice()).toHaveTextContent(success);
  expect(screen.getByText("B", { selector: "p" })).toBeInTheDocument();
});

it("O-102 frontend validation explains the block before submission", () => {
  render(<MainPage />);
  edit("😀");
  expect(button()).toBeDisabled();
  expect(input()).toHaveAccessibleDescription(/글자나 숫자/);
  fireEvent.submit(input().form!);
  expect(ipc).not.toHaveBeenCalled();
  expect(notice()).toBeEmptyDOMElement();
  edit("a".repeat(8193));
  expect(input()).toHaveAccessibleDescription(/8,192바이트/);
  edit("정상");
  expect(button()).toBeEnabled();
  expect(input()).not.toHaveAttribute("aria-describedby");
});
