import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useTransmission } from "../src/features/user-input/hooks/useTransmission";
import { createUserInputRequest } from "../src/features/user-input/userInputRequest";
import MainPage from "../src/pages/MainPage";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
const ipc = vi.mocked(invoke);
const request = createUserInputRequest("  e\u0301\r\n한글 😀  ")!;
const received = { status: "received", requestId: request.requestId, receivedText: request.rawText };
const rejected = { status: "rejected", requestId: request.requestId, errorCode: "INVALID_INPUT", message: "Invalid input" };

function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => { vi.useFakeTimers(); ipc.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

function start() {
  const reply = deferred();
  ipc.mockReturnValueOnce(reply.promise);
  const hook = renderHook(useTransmission);
  expect(hook.result.current.state.status).toBe("idle");
  act(() => { void hook.result.current.send(request); });
  return { ...hook, reply };
}

it("MT-T000-01 MT-T001-01 MT-T001-02 MT-T100-01 MT-T100-02 정확한 Command·DTO와 원문·ID 유지", () => {
  start();
  expect(ipc.mock.calls).toEqual([["receive_user_input", { request }]]);
  expect(ipc.mock.calls[0][1]).toHaveProperty("request", { rawText: request.rawText, requestId: request.requestId });
});

it.each([["MT-T102-01", received], ["MT-T102-02", rejected]] as const)("%s MT-T101-01 MT-T200-01 원시 응답과 원래 요청 연결", async (_, response) => {
  const { result, reply } = start();
  expect(result.current.state).toEqual({ status: "sending", request });
  await act(async () => reply.resolve(response));
  expect(result.current.state).toEqual({ status: response.status, request, response });
  expect(vi.getTimerCount()).toBe(0);
});

it("MT-T201-01 동일 이벤트 루프의 두 제출을 한 번만 호출", () => {
  const { result } = renderHook(useTransmission);
  ipc.mockReturnValue(deferred().promise);
  act(() => {
    void result.current.send(request);
    void result.current.send(request);
  });
  expect(ipc).toHaveBeenCalledTimes(1);
});

it.each(["Command not found", "invalid args", new Error("IPC failed")])("MT-T202-01 MT-T202-02 기술적 실패 %s", async reason => {
  const { result, reply } = start();
  await act(async () => reply.reject(reason));
  expect(result.current.state).toEqual({ status: "error", request, code: "IPC_ERROR" });
});

it("동기 예외에도 전송 잠금 해제", async () => {
  ipc.mockImplementationOnce(() => { throw new Error("unavailable"); });
  const { result } = renderHook(useTransmission);
  await act(() => result.current.send(request));
  expect(result.current.state.status).toBe("error");
  ipc.mockResolvedValueOnce(received);
  await act(() => result.current.send(request));
  expect(result.current.state.status).toBe("received");
});

it("MT-T203-01 9999ms 대기 후 10000ms에 미확인", () => {
  const { result } = start();
  act(() => vi.advanceTimersByTime(9999));
  expect(result.current.state.status).toBe("sending");
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.state).toEqual({ status: "unconfirmed", request, code: "RESPONSE_UNCONFIRMED" });
  expect(ipc).toHaveBeenCalledTimes(1);
});

it("기한 직전 도착한 응답은 유지", async () => {
  const { result, reply } = start();
  act(() => vi.advanceTimersByTime(9999));
  await act(async () => reply.resolve(received));
  act(() => vi.advanceTimersByTime(2));
  expect(result.current.state.status).toBe("received");
});

it.each(["resolve", "reject"] as const)("MT-T203-02 MT-T204-02 이전 요청의 늦은 %s 무시", async method => {
  const { result, reply } = start();
  act(() => vi.advanceTimersByTime(10001));
  const next = createUserInputRequest(request.rawText)!;
  expect(next.requestId).not.toBe(request.requestId);
  const nextReply = deferred();
  ipc.mockReturnValueOnce(nextReply.promise);
  act(() => { void result.current.send(next); });
  await act(async () => reply[method](received));
  expect(result.current.state).toEqual({ status: "sending", request: next });
  await act(async () => nextReply.resolve({ ...received, requestId: next.requestId }));
  expect(result.current.state.status).toBe("received");
});

it.each(["received", "rejected", "error", "unconfirmed"])("MT-T204-01 %s 종료 후 버튼 복구 및 새 ID 발급", async end => {
  const reply = deferred();
  ipc.mockReturnValueOnce(reply.promise).mockReturnValueOnce(deferred().promise);
  render(<MainPage />);
  const input = screen.getByRole<HTMLTextAreaElement>("textbox");
  const button = screen.getByRole("button", { name: "전송" });
  fireEvent.change(input, { target: { value: "A" } });
  fireEvent.click(button);
  expect(button).toBeDisabled();
  fireEvent.change(input, { target: { value: "B" } });
  fireEvent.submit(input.form!);
  expect(ipc).toHaveBeenCalledTimes(1);
  if (end === "unconfirmed") act(() => vi.advanceTimersByTime(10000));
  else if (end === "error") await act(async () => reply.reject("failed"));
  else await act(async () => reply.resolve(end === "received" ? received : rejected));
  expect(button).toBeEnabled();
  fireEvent.click(button);
  const args = ipc.mock.calls.map(([, args]) => args as { request: typeof request });
  expect(args.map(arg => arg.request.rawText)).toEqual(["A", "B"]);
  expect(args[0].request.requestId).not.toBe(args[1].request.requestId);
});

it("검증되지 않은 payload는 가공 없이 O 경계로 전달", async () => {
  const { result, reply } = start();
  await act(async () => reply.resolve(null));
  expect(result.current.state).toEqual({ status: "received", request, response: null });
});

it("언마운트 후 타이머 제거 및 지연 실패 무시", async () => {
  const { unmount, reply } = start();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => reply.reject("late"));
  expect(ipc).toHaveBeenCalledTimes(1);
});

it("타이머 콜백이 밀려도 기한을 지난 응답은 미확인", async () => {
  const { result, reply } = start();
  const clock = vi.spyOn(performance, "now").mockReturnValue(performance.now() + 10_001);
  try {
    await act(async () => reply.resolve(received));
    expect(result.current.state).toEqual({ status: "unconfirmed", request, code: "RESPONSE_UNCONFIRMED" });
  } finally {
    clock.mockRestore();
  }
});

it("다음 제출 전 도착한 늦은 응답도 종료 상태를 유지", async () => {
  const { result, reply } = start();
  act(() => vi.advanceTimersByTime(10_000));
  const terminal = result.current.state;
  await act(async () => reply.resolve(received));
  expect(result.current.state).toBe(terminal);
});
