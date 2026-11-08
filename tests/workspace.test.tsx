import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/app/App";

const storageKey = "agent-workspace-theme";
const toggle = () => within(screen.getByRole("banner")).getByRole("button");
const expectTheme = (theme: string) => expect(document.documentElement).toHaveAttribute("data-theme", theme);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("Workspace", () => {
  it("UI-001 레이아웃 영역이 함께 표시된다", () => {
    render(<App />);
    for (const role of ["banner", "complementary", "main"]) expect(screen.getByRole(role)).toBeVisible();
  });
  it("UI-002 헤더에 앱 이름과 현재 화면 표시", () => {
    render(<App />);
    const header = within(screen.getByRole("banner"));
    expect(header.getByText("Agent Workspace")).toBeVisible();
    expect(header.getByText("Home")).toBeVisible();
  });
  it("UI-003 사이드바에 탐색 메뉴 표시", () => {
    render(<App />);
    expect(within(screen.getByRole("complementary")).getByRole("navigation")).toBeVisible();
  });
  it("UI-004 Home은 현재 페이지", () => {
    render(<App />);
    expect(within(screen.getByRole("navigation")).getByText("Home")).toHaveAttribute("aria-current", "page");
  });
  it("UI-005 개발 예정 메뉴 비활성", () => {
    render(<App />);
    for (const name of ["Agents", "Workflows"]) expect(screen.getByRole("button", { name })).toBeDisabled();
  });
  it("UI-006 메인 제목 표시", () => {
    render(<App />);
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1 })).toHaveTextContent("무엇을 도와드릴까요?");
  });
  it("UI-007 메인 안에 입력창과 전송 버튼 표시", () => {
    render(<App />);
    const main = within(screen.getByRole("main"));
    expect(main.getByRole("textbox", { name: "업무 요청" })).toBeVisible();
    expect(main.getByRole("button", { name: "전송" })).toBeDisabled();
  });
  it("UI-008 첫 실행 Light", () => {
    render(<App />);
    expectTheme("light");
  });
  it("UI-009 Dark 전환", async () => {
    render(<App />);
    await userEvent.click(toggle());
    expectTheme("dark");
    expect(toggle()).toHaveAccessibleName(/라이트 모드로 전환/);
  });
  it("UI-010 Light 복귀", async () => {
    localStorage.setItem(storageKey, "dark");
    render(<App />);
    await userEvent.click(toggle());
    expectTheme("light");
    expect(localStorage.getItem(storageKey)).toBe("light");
  });
  it("UI-011 테마 선택 저장", async () => {
    render(<App />);
    await userEvent.click(toggle());
    expect(localStorage.getItem(storageKey)).toBe("dark");
  });
  it("UI-012 저장된 테마 복원", () => {
    localStorage.setItem(storageKey, "dark");
    render(<App />);
    expectTheme("dark");
  });
  it("UI-013 잘못된 설정은 Light", () => {
    localStorage.setItem(storageKey, "unknown");
    render(<App />);
    expectTheme("light");
  });
  it("UI-014 Tab과 Enter로 테마 변경", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(toggle()).toHaveFocus();
    await user.keyboard("{Enter}");
    expectTheme("dark");
  });
  it("UI-015 테마 전환 후에도 원래 입력을 제출", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole("textbox");
    await user.type(input, " A!");
    await user.click(toggle());
    expect(input).toHaveValue(" A!");
    await user.click(screen.getByRole("button", { name: "전송" }));
    expect(screen.getByRole("status")).toHaveTextContent("3자 · 1줄");
  });
  it("UI-016 저장소 접근 실패 시에도 테마 변경", async () => {
    const unavailable = () => { throw new Error("Storage unavailable"); };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(unavailable);
    render(<App />);
    expectTheme("light");
    await userEvent.click(toggle());
    expectTheme("dark");
  });
});
