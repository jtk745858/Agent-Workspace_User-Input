import { createUserInputRequest, type UserInputRequest } from "../userInputRequest";
import UserInputForm from "./UserInputForm";

type Props = { onRequest: (request: UserInputRequest) => void; sending?: boolean };

export default function UserInputRequestForm({ onRequest, sending = false }: Props) {
  function handleSubmittedText(rawText: string) {
    if (sending) return;
    const request = createUserInputRequest(rawText);
    if (request) onRequest(request);
  }

  return <UserInputForm sending={sending} onSubmitText={handleSubmittedText} />;
}
