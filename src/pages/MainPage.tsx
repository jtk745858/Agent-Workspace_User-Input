import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { useState } from "react";
import UserInputRequestForm from "../features/user-input/components/UserInputRequestForm";
import type { UserInputRequest } from "../features/user-input/userInputRequest";

export default function MainPage() {
  const [receipt, setReceipt] = useState("");

  function handleRequest({ rawText: text }: UserInputRequest) {
    const characters = Array.from(text).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    setReceipt("최근 FE 입력 처리부 전달: " + characters + "자 · " + lines + "줄");
  }

  return (
    <main className="page">
      <div className="welcome">
        <div className="constellation" aria-hidden="true"><span><WorkspaceIcon name="workspace" /></span></div>
        <h1>무엇을 도와드릴까요?</h1>
        <p>자연어로 요청을 입력하세요.</p>
      </div>
      <div className="composer">
        <UserInputRequestForm onRequest={handleRequest} />
        <p className="receipt" role="status">{receipt}</p>
      </div>
    </main>
  );
}
