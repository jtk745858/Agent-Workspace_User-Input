import { useState } from "react";
import { createChatEntry, type ChatEntry } from "../features/user-input/chatEntry";
import type { UserInputRequest } from "../features/user-input/userInputRequest";
import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { useTransmission } from "../features/user-input/hooks/useTransmission";
import UserInputRequestForm from "../features/user-input/components/UserInputRequestForm";

import ChatConversation from "../features/user-input/components/ChatConversation";

export default function MainPage() {
  const { state, send } = useTransmission();

  const [completed, setCompleted] = useState<ChatEntry[]>([]);
  const entries = state.status === "sending" ? [...completed, createChatEntry(state)] : completed;

  function submit(request: UserInputRequest) {
    void send(request, result => {
      const entry = createChatEntry(result);
      setCompleted(previous => [...previous, entry]);
    });
  }

  return (
    <main className="page">
      {entries.length === 0 ? <div className="welcome">
        <div className="constellation" aria-hidden="true"><span><WorkspaceIcon name="workspace" /></span></div>
        <h1>무엇을 도와드릴까요?</h1>
        <p>자연어로 요청을 입력하세요.</p>
        <div role="status" />
      </div> : <ChatConversation entries={entries} />}
      <div className="composer">
        <UserInputRequestForm onRequest={submit} sending={state.status === "sending"} />
      </div>
    </main>
  );
}
