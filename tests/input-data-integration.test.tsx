import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import UserInputRequestForm from "../src/features/user-input/components/UserInputRequestForm";
import type { UserInputRequest } from "../src/features/user-input/userInputRequest";

function setup() {
  const user = userEvent.setup();
  const onRequest = vi.fn<(request: UserInputRequest) => void>();
  render(<UserInputRequestForm onRequest={onRequest} />);
  const input = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "업무 요청" });
  const button = screen.getByRole("button", { name: "전송" });
  async function edit(text: string) {
    await user.clear(input);
    await user.paste(text);
  }
  return { input, button, onRequest, edit, user };
}

it("IT-001 버튼 클릭에서 DTO 생성", async () => {
  const { edit, button, onRequest, user } = setup();
  await edit("  요청 😀  ");
  await user.click(button);
  expect(onRequest.mock.calls).toEqual([[{ requestId: expect.any(String), rawText: "  요청 😀  " }]]);
});

it.each([
  ["IT-002", "   "],
  ["IT-006", "a".repeat(8193)],
  ["IT-007", "😀!!!"],
])("%s 직접 제출도 차단", async (_, text) => {
  const { edit, input, button, onRequest } = setup();
  await edit(text);
  expect(button).toBeDisabled();
  fireEvent.submit(input.form!);
  expect(onRequest).not.toHaveBeenCalled();
});

it("IT-003 수정된 원문 제출", async () => {
  const { edit, button, onRequest, user } = setup();
  await edit("A");
  await edit("B");
  await user.click(button);
  expect(onRequest.mock.calls[0][0].rawText).toBe("B");
});

it("IT-004 제출 후 편집", async () => {
  const { edit, button, onRequest, user } = setup();
  await edit("A");
  await user.click(button);
  await edit("B");
  expect(onRequest.mock.calls[0][0].rawText).toBe("A");
});

it("IT-005 동일 원문 재제출", async () => {
  const { edit, button, onRequest, user } = setup();
  await edit("A");
  await user.click(button);
  await user.click(button);
  const [a, b] = onRequest.mock.calls.map(([request]) => request);
  expect(a.rawText).toBe(b.rawText);
  expect(a.requestId).not.toBe(b.requestId);
});

it("IT-008 입력 변경에 따른 버튼 상태", async () => {
  const { edit, button } = setup();
  await edit("1️⃣");
  expect(button).toBeDisabled();
  await edit("1️⃣2");
  expect(button).toBeEnabled();
  await edit("A\ud800");
  expect(button).toBeDisabled();
});
