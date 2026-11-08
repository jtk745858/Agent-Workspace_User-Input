import { isValidUserInput } from "./isValidUserInput";

export type UserInputRequest = Readonly<{
  requestId: string;
  rawText: string;
}>;

export function createUserInputRequest(rawText: string): UserInputRequest | null {
  if (!isValidUserInput(rawText)) return null;
  return { requestId: crypto.randomUUID(), rawText };
}
