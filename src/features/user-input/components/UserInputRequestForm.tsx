import { createUserInputRequest, type UserInputRequest } from "../userInputRequest";
import UserInputForm from "./UserInputForm";

export default function UserInputRequestForm({ onRequest }: { onRequest: (request: UserInputRequest) => void }) {
  function handleSubmittedText(rawText: string) {
    const request = createUserInputRequest(rawText);
    if (request) onRequest(request);
  }

  return <UserInputForm onSubmitText={handleSubmittedText} />;
}
