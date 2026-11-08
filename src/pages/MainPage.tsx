import { useState } from "react";
import UserInputForm from "../features/user-input/components/UserInputForm";

export default function MainPage() {
  const [receipt, setReceipt] = useState("");

  function handleSubmittedText(text: string) {
    const characters = Array.from(text).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    setReceipt("최근 FE 입력 처리부 전달: " + characters + "자 · " + lines + "줄");
  }

  return (
    <main className="page">
      <p className="eyebrow">User Input PoC</p>
      <h1>AI Agent Orchestration</h1>
      <UserInputForm onSubmitText={handleSubmittedText} />
      <p className="receipt" role="status">{receipt}</p>
    </main>
  );
}
