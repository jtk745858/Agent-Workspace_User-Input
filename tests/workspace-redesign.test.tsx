import { invoke } from "@tauri-apps/api/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import App from "../src/app/App";
import type { UserInputRequest } from "../src/features/user-input/userInputRequest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
const ipc = vi.mocked(invoke);
const rail = () => within(screen.getByRole("navigation", { name: "주 탐색" }));
const go = (name: string) => fireEvent.click(rail().getByRole("button", { name }));
const input = () => screen.getByRole<HTMLTextAreaElement>("textbox", { name: "업무 요청" });
function submit(text: string) {
  let resolve!: (value: unknown) => void;
  let reject!: () => void;
  ipc.mockReturnValueOnce(new Promise((ok, fail) => { resolve = ok; reject = fail; }));
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "전송" }));
  const { request } = ipc.mock.lastCall![1] as { request: UserInputRequest };
  return {
    request,
    finish: () => act(async () => resolve({ status: "received", requestId: request.requestId, receivedText: request.rawText })),
    fail: () => act(async () => reject()),
  };
}
beforeEach(() => { localStorage.clear(); ipc.mockReset(); render(<App />); });
afterEach(() => { vi.useRealTimers(); });

it("UI-01 기본 Workspace 영역", () => {
  expect(rail().getByRole("button", { name: "홈" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("complementary")).toBeVisible();
  expect(screen.getByRole("banner")).toHaveTextContent("Home");
  expect(screen.getByRole("main")).toBeVisible();
});
it("UI-02 Navigation Rail 실제 페이지 전환", () => {
  go("실행 이력");
  expect(screen.getByRole("heading", { name: "실행 이력" })).toBeVisible();
  expect(rail().getByRole("button", { name: "실행 이력" })).toHaveAttribute("aria-current", "page");
  go("홈");
  expect(input()).toBeVisible();
});
it("UI-03 사이드바 접기 및 펼치기", () => {
  fireEvent.click(screen.getByRole("button", { name: "사이드바 접기" }));
  expect(screen.queryByRole("complementary")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
  expect(screen.getByRole("complementary")).toBeVisible();
});
it("UI-04 예시 선택은 입력만 채움", () => {
  fireEvent.click(within(screen.getByRole("region", { name: "예시 업무" })).getByRole("button", { name: /경쟁 서비스 비교/ }));
  expect(input().value).toContain("Alpha, Beta, Gamma");
  expect(input()).toHaveFocus();
  expect(ipc).not.toHaveBeenCalled();
});
it("UI-05 Home에서 Command와 원문 전달", () => {
  const { request } = submit("  안녕하세요 😀\nHello  ");
  expect(ipc).toHaveBeenCalledWith("receive_user_input", { request });
  expect(request.rawText).toBe("  안녕하세요 😀\nHello  ");
  expect(screen.getByRole("status")).toHaveTextContent("Core 응답 대기 중");
});
it("UI-06 검증된 Core 수신 표시", async () => {
  await submit("A").finish();
  expect(screen.getByRole("status")).toHaveTextContent("정상적으로 수신");
});
it("UI-07 여러 대화 누적", async () => {
  await submit("A").finish();
  await submit("B").finish();
  expect(screen.getAllByRole("listitem").map(row => row.querySelector(".chat-user p")?.textContent)).toEqual(["A", "B"]);
});
it("UI-08 화면 왕복 후 기존 대화 유지", async () => {
  await submit("A").finish();
  const row = screen.getByRole("listitem");
  go("결과물"); go("홈");
  expect(screen.getByRole("listitem")).toBe(row);
  expect(screen.getByRole("status")).toHaveTextContent("정상적으로 수신");
});
it("UI-09 무효 입력은 기록과 호출 없음", () => {
  fireEvent.change(input(), { target: { value: "😀" } });
  fireEvent.submit(input().form!);
  expect(ipc).not.toHaveBeenCalled();
  expect(screen.queryByRole("listitem")).toBeNull();
  expect(input()).toHaveAccessibleDescription(/글자나 숫자/);
});
it("UI-10 IPC 실패와 타임아웃 기록 보존", async () => {
  vi.useFakeTimers();
  await submit("A").fail();
  expect(screen.getByRole("status")).toHaveTextContent("IPC_ERROR");
  const b = submit("B");
  go("Workflows");
  act(() => vi.advanceTimersByTime(10000));
  go("홈");
  expect(screen.getByRole("status")).toHaveTextContent("RESPONSE_UNCONFIRMED");
  await b.finish();
  expect(screen.getByRole("status")).toHaveTextContent("RESPONSE_UNCONFIRMED");
  expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("IPC_ERROR");
});
it("UI-11 화면 이동 중 초안과 진행 요청 유지", async () => {
  const a = submit("A");
  fireEvent.change(input(), { target: { value: "다음 요청" } });
  go("설정");
  await a.finish();
  go("홈");
  expect(input()).toHaveValue("다음 요청");
  expect(screen.getByRole("status")).toHaveTextContent("정상적으로 수신");
  expect(ipc).toHaveBeenCalledTimes(1);
});
it("UI-12 Workflow 검색과 Guidance 탭", () => {
  go("Workflows");
  fireEvent.change(screen.getByRole("textbox", { name: "워크플로 검색" }), { target: { value: "팀" } });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article")).toHaveTextContent("팀 의사결정");
  fireEvent.change(screen.getByRole("textbox", { name: "워크플로 검색" }), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Guidance demos" }));
  expect(screen.getAllByRole("article")).toHaveLength(2);
});
it("UI-13 그래프 노드와 Steps 상세 연동", () => {
  go("Workflows");
  fireEvent.click(screen.getAllByRole("button", { name: "흐름 살펴보기" })[0]);
  fireEvent.click(screen.getByRole("button", { name: /STEP 2 기능 조사/ }));
  expect(within(screen.getByRole("complementary", { name: "노드 상세" })).getByRole("heading", { name: "기능 조사" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Steps" }));
  fireEvent.click(screen.getByRole("button", { name: "6 보고서 작성" }));
  expect(within(screen.getByRole("complementary", { name: "노드 상세" })).getByRole("heading", { name: "보고서 작성" })).toBeVisible();
});
it("UI-14 실행 상세에서 결과물 및 검토 화면 탐색", () => {
  go("실행 이력");
  fireEvent.click(screen.getByRole("button", { name: "문제 탐색과 정의 실행 상세" }));
  fireEvent.click(screen.getByRole("button", { name: "입력 확인 및 검토" }));
  expect(screen.getByRole("textbox", { name: "비교 대상" })).toHaveValue("Alpha, Beta, Gamma");
  expect(screen.getByRole("button", { name: "승인 · 준비 중" })).toBeDisabled();
  go("결과물");
  fireEvent.click(screen.getAllByRole("button", { name: "미리보기" })[1]);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("features-out.json");
  expect(screen.getByRole("article")).toHaveTextContent('"source": "UI 검토용 합성 데이터"');
});
it("UI-15 실제 요청과 데모 탐색 구분", () => {
  go("Workflows");
  expect(screen.getByText(/데모 데이터 · UI 검토용/)).toBeVisible();
  expect(screen.getAllByRole("button", { name: "실행 · 준비 중" })[0]).toBeDisabled();
  expect(ipc).not.toHaveBeenCalled();
  go("설정");
  expect(screen.getByRole("checkbox", { name: "완료 알림" })).toBeDisabled();
});
it("UI-16 키보드로 메뉴 전환과 테마 설정", async () => {
  const user = userEvent.setup();
  await user.tab();
  expect(rail().getByRole("button", { name: "홈" })).toHaveFocus();
  await user.tab(); await user.keyboard("{Enter}");
  expect(screen.getByRole("heading", { name: "Workflows" })).toBeVisible();
  go("설정");
  await user.click(screen.getByRole("button", { name: "Dark로 전환" }));
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  go("홈");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});
