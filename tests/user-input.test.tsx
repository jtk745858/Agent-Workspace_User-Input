import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../src/app/App";
import UserInputForm from "../src/features/user-input/components/UserInputForm";

const textbox = () => screen.getByRole<HTMLTextAreaElement>("textbox", { name: "업무 요청" });
const submitButton = () => screen.getByRole("button", { name: "전송" });

function setupForm() {
  const user = userEvent.setup();
  const onSubmitText = vi.fn<(text: string) => void>();
  render(<UserInputForm onSubmitText={onSubmitText} />);
  const input = textbox();
  async function paste(text: string) {
    await user.click(input);
    await user.paste(text);
  }
  return { user, input, button: submitButton(), paste, onSubmitText };
}

describe("I-000 메인 페이지 입력창 표시", () => {
  it("TC-I-000-01 메인 화면에 여러 줄 입력 영역이 표시된다", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "AI Agent Orchestration" })).toBeVisible();
    expect(screen.getByLabelText("업무 요청")).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByLabelText("업무 요청")).toBeVisible();
  });

  it("TC-I-000-02 접근 가능한 이름과 textbox 역할로 입력창을 찾는다", () => {
    render(<App />);
    expect(textbox()).toHaveAccessibleName("업무 요청");
  });

  it("TC-I-000-03 Tab으로 입력창에 포커스한다", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    expect(textbox()).toHaveFocus();
  });
});

describe("I-001 자연어 텍스트 입력", () => {
  it.each([
    ["TC-I-001-01", "한글 입력"],
    ["TC-I-001-02", "Hello world"],
    ["TC-I-001-03", "12345!@#$%"],
    ["TC-I-001-04", "こんにちは 漢字 中文"],
    ["TC-I-001-05", "첫 줄\nsecond line"],
    ["TC-I-001-06", "😀"],
  ])("%s 입력한 문자열을 그대로 표시한다 (%j)", async (_id, text) => {
    const { input, paste } = setupForm();
    await paste(text);
    expect(input).toHaveValue(text);
  });
});

describe("I-002 입력 내용 수정 및 삭제", () => {
  it("TC-I-002-01 선택한 부분을 새 텍스트로 바꾼다", async () => {
    const { input, user, paste } = setupForm();
    await paste("회의 전 메모");
    input.setSelectionRange(3, 4);
    await user.paste("후");
    expect(input).toHaveValue("회의 후 메모");
  });

  it("TC-I-002-02 일부 문자만 지운다", async () => {
    const { input, user, paste } = setupForm();
    await paste("요청!");
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("요청");
  });

  it("TC-I-002-03 전체 내용을 지운다", async () => {
    const { input, user, paste } = setupForm();
    await paste("첫 줄\n둘째 줄");
    await user.clear(input);
    expect(input).toHaveValue("");
  });

  it("TC-I-002-04 삭제 후 다시 입력한다", async () => {
    const { input, user, paste } = setupForm();
    await paste("이전 내용");
    await user.clear(input);
    await user.type(input, "new");
    expect(input).toHaveValue("new");
  });
});

describe("I-100 전송 버튼 표시 및 활성화", () => {
  it("TC-I-100-01 초기 버튼은 보이고 비활성화되어 있다", () => {
    const { button } = setupForm();
    expect(button).toBeVisible();
    expect(button).toBeDisabled();
  });

  it.each([
    ["TC-I-100-14 REG-001", "!@#$%"],
    ["REG-002", "?!...,,, "],
    ["REG-004", "😀 !@#$%"],
    ["TC-I-100-02", "   "],
    ["TC-I-100-03", "\n\n"],
    ["TC-I-100-04", " \n \t "],
    ["TC-I-100-05 REG-003", "😀"],
    ["TC-I-100-06", "😀🔥👍"],
    ["TC-I-100-07 REG-006", " 👨‍👩‍👧‍👦 "],
    ["TC-I-100-08", "🇰🇷"],
    ["TC-I-100-18", "\t\t"],
    ["TC-I-100-19", "👍🏽"],
    ["TC-I-100-20 REG-005", "1️⃣"],
  ])("%s 입력창에 %j를 허용하되 제출은 비활성화한다", async (_id, text) => {
    const { input, button, paste } = setupForm();
    await paste(text);
    expect(input).toHaveValue(text);
    expect(button).toBeDisabled();
  });

  it.each([
    ["REG-012", "안녕하세요!!!"],
    ["TC-I-100-09 REG-007", "안녕하세요"],
    ["TC-I-100-10 REG-008", "Hello"],
    ["TC-I-100-11 REG-009", "こんにちは"],
    ["TC-I-100-12 REG-010", "漢字"],
    ["TC-I-100-13 REG-011", "12345"],
    ["TC-I-100-15 REG-013", "😀 안녕하세요"],
  ])("%s %j를 입력하면 활성화한다", async (_id, text) => {
    const { button, paste } = setupForm();
    await paste(text);
    expect(button).toBeEnabled();
  });

  it("TC-I-100-16 REG-014 유효한 입력을 전부 지우면 다시 비활성화한다", async () => {
    const { button, input, user, paste } = setupForm();
    await paste("내용");
    expect(button).toBeEnabled();
    await user.clear(input);
    expect(button).toBeDisabled();
  });

  it("TC-I-100-17 공백만 남기면 다시 비활성화한다", async () => {
    const { button, input, user, paste } = setupForm();
    await paste("  X");
    expect(button).toBeEnabled();
    await user.keyboard("{Backspace}");
    expect(input).toHaveValue("  ");
    expect(button).toBeDisabled();
  });
});

describe("I-101 사용자 제출 동작 감지", () => {
  it("TC-I-101-01 메인 화면에서 유효한 입력을 제출하면 FE 확인 정보가 갱신된다", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(textbox(), "abc");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await user.click(submitButton());
    expect(screen.getByRole("status")).toHaveTextContent("3자 · 1줄");
  });

  it("TC-I-101-02 한 번 클릭하면 submit 이벤트가 한 번 발생한다", async () => {
    const { input, user, button, paste } = setupForm();
    const listener = vi.fn();
    input.form!.addEventListener("submit", listener);
    await paste("요청");
    await user.click(button);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("TC-I-101-03 비활성 버튼 클릭은 submit 이벤트를 발생시키지 않는다", async () => {
    const { input, user, button } = setupForm();
    const listener = vi.fn();
    input.form!.addEventListener("submit", listener);
    await user.click(button);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("I-102 입력 제출 이벤트 전달", () => {
  it.each([
    ["TC-I-102-01", "정상 요청"],
    ["REG-016", "  안녕하세요! 😀  "],
    ["TC-I-102-03", "  안녕하세요  "],
    ["TC-I-102-04", "첫 줄\n\n  둘째 줄 😀\t"],
  ])("%s 원문 %j를 입력 처리부에 한 번 전달한다", async (_id, text) => {
    const { onSubmitText, button, user, paste } = setupForm();
    await paste(text);
    await user.click(button);
    expect(onSubmitText).toHaveBeenCalledTimes(1);
    expect(onSubmitText).toHaveBeenCalledWith(text);
  });

  it("TC-I-102-02 수정 후 제출하면 최종 문자열을 전달한다", async () => {
    const { onSubmitText, user, button, paste } = setupForm();
    await paste("작업 A");
    await user.keyboard("{Backspace}B");
    await user.click(button);
    expect(onSubmitText.mock.calls).toEqual([["작업 B"]]);
  });

  it.each([
    ["REG-015", "😀!!!"],
    ["TC-I-102-05", " 👨‍👩‍👧‍👦\t👍🏽 "],
    ["TC-I-102-06", " \n\t "],
  ])("%s %j는 폼 제출을 직접 발생시켜도 입력 처리부에 도달하지 않는다", async (_id, text) => {
    const { input, onSubmitText, paste } = setupForm();
    await paste(text);
    expect(input).toHaveValue(text);
    fireEvent.submit(input.form!);
    expect(onSubmitText).not.toHaveBeenCalled();
  });
});
