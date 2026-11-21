import { createUserInputRequest, type UserInputRequest } from "../userInputRequest";
import UserInputForm, { type InputExample } from "./UserInputForm";

type Props = { onRequest: (request: UserInputRequest) => void; sending?: boolean; examples?: readonly InputExample[] };

export default function UserInputRequestForm({ onRequest, sending = false, examples }: Props) {
  function handleSubmittedText(rawText: string) {
    if (sending) return;
    const request = createUserInputRequest(rawText);
    if (request) onRequest(request);
  }

  return <UserInputForm examples={examples} sending={sending} onSubmitText={handleSubmittedText} />;
}
