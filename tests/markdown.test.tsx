import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import MarkdownContent from "../src/components/markdown/MarkdownContent";
import WorkspacePages from "../src/pages/WorkspacePages";
import App from "../src/app/App";
import { invoke } from "@tauri-apps/api/core";
import { workflowMarkdown } from "./fixtures/workflowMarkdown";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

it("MD-T01 headings 1–6, emphasis, inline code, rule and strike", () => {
  const { container } = render(<MarkdownContent content={Array.from({length: 6}, (_, i) => "#".repeat(i + 1) + " 제목" + i).join("\n\n") + "\n\n**굵게** *기울임* ~~취소~~ \u0060inline\u0060\n\n---"} />);
  for (let i = 1; i <= 6; i++) expect(screen.getByRole("heading", {level: i})).toBeVisible();
  for (const tag of ["strong", "em", "del", "code", "hr"]) expect(container.querySelector(tag)).not.toBeNull();
});
it("MD-T02 nested lists, tasks and quote", () => {
  const { container } = render(<MarkdownContent content={"1. 순서\n   - 중첩\n\n- [x] 완료\n- [ ] 대기\n\n> 인용"} />);
  expect(container.querySelector("ol ul li")).toHaveTextContent("중첩");
  expect(container.querySelector("blockquote")).toHaveTextContent("인용");
  const checks = screen.getAllByRole("checkbox");
  expect(checks[0]).toBeChecked(); expect(checks[1]).not.toBeChecked();
  checks.forEach(check => expect(check).toBeDisabled());
});
it("MD-T03 fixture GFM table has semantic cells and focusable wrapper", () => {
  render(<MarkdownContent content={workflowMarkdown} />);
  expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  expect(screen.getAllByRole("row")).toHaveLength(4);
  expect(screen.getByRole("region", {name: "Markdown 표"})).toHaveAttribute("tabindex", "0");
});
it("MD-T04 code preserves whitespace and newlines", () => {
  const code = "function test() {\n  return 1;\n}\n";
  const { container } = render(<MarkdownContent content={"\u0060\u0060\u0060js\n" + code + "\u0060\u0060\u0060"} />);
  expect(container.querySelector("pre code")?.textContent).toBe(code);
  expect(screen.getByLabelText("코드 블록")).toHaveAttribute("tabindex", "0");
});
it("MD-T05 long content remains complete (layout measured separately)", () => {
  const long = "A".repeat(5000);
  const { container } = render(<MarkdownContent content={long + "\n\n\u0060\u0060\u0060\n" + long + "\n\u0060\u0060\u0060"} />);
  expect(container.querySelector("p")?.textContent).toBe(long);
  expect(container.querySelector("pre code")?.textContent).toBe(long + "\n");
});
it("MD-T06 raw HTML, unsafe URLs and external images are inert", () => {
  const { container } = render(<MarkdownContent content={'<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert%281%29) [data](data:text/html,test) [file](file:///C:/test) [relative](/x)\n\n![tracking](https://example.com/pixel.png)\n\n[good](https://example.com/path)'} />);
  expect(container.querySelector("script,img,iframe")).toBeNull();
  expect(screen.getAllByRole("link")).toHaveLength(1);
  const link = screen.getByRole("link", {name: "good"});
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(screen.getByText(/이미지 자동 로딩 안 함/)).toBeVisible();
});
it("MD-T07 user Markdown stays literal through submission and navigation", async () => {
  vi.mocked(invoke).mockResolvedValueOnce({status:"received", requestId:"mismatch", receivedText:"unused"});
  const { container } = render(<App />);
  const raw = "  ### 제목\n**그대로** <img src=x>  ";
  fireEvent.change(screen.getByRole("textbox", {name:"업무 요청"}), {target:{value:raw}});
  fireEvent.click(screen.getByRole("button", {name:"전송"}));
  await screen.findByText("나");
  expect(container.querySelector(".chat-user p")?.textContent).toBe(raw);
  expect(container.querySelector(".chat-user h3,.chat-user strong,.chat-user img")).toBeNull();
  const rail = within(screen.getByRole("navigation", {name:"주 탐색"}));
  fireEvent.click(rail.getByRole("button", {name:"결과물"}));
  fireEvent.click(rail.getByRole("button", {name:"홈"}));
  expect(container.querySelector(".chat-user p")?.textContent).toBe(raw);
});
it("MD-T08 available Markdown Artifact integrates renderer; JSON stays raw", () => {
  const props = {navigate:vi.fn(), theme:"light" as const, toggleTheme:vi.fn()};
  const { rerender, container } = render(<WorkspacePages {...props} route={{page:"artifact",artifact:0}} />);
  expect(screen.getByRole("heading", {name:"경쟁 서비스 비교"})).toBeVisible();
  expect(container.querySelector(".markdown-content")).not.toBeNull();
  rerender(<WorkspacePages {...props} route={{page:"artifact",artifact:1}} />);
  expect(container.querySelector(".markdown-content")).toBeNull();
  expect(screen.getByLabelText("결과물 원문")).toHaveTextContent('"source"');
});
it("MD-T09 empty strings render safely", () => {
  const {container} = render(<MarkdownContent content="" />);
  expect(container.querySelector(".markdown-content")).toBeEmptyDOMElement();
});
it("MD-T10 repeat updates and artifact page changes", () => {
  const {rerender} = render(<MarkdownContent content={workflowMarkdown} />);
  rerender(<MarkdownContent content="# 두 번째" />);
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByRole("heading", {name:"두 번째"})).toBeVisible();
  rerender(<MarkdownContent content={workflowMarkdown} />);
  expect(screen.getAllByRole("table")).toHaveLength(1);
});
