import { workflows } from "./workspaceDemo";
import { useState } from "react";
import { createChatEntry, type ChatEntry } from "../features/user-input/chatEntry";
import type { UserInputRequest } from "../features/user-input/userInputRequest";
import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { useTransmission } from "../features/user-input/hooks/useTransmission";
import UserInputRequestForm from "../features/user-input/components/UserInputRequestForm";

import ChatConversation from "../features/user-input/components/ChatConversation";

export default function MainPage({ hidden = false }: { hidden?: boolean }) {
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
    <main className={`page ${entries.length ? "chat-page" : "home-page"}`} hidden={hidden}>
      {entries.length === 0 ? <div className="welcome">
        <span className="brand-mark"><WorkspaceIcon name="workspace" /></span>
        <div className="eyebrow">FROM INTENT TO IMPACT</div>
        <h1>어떤 일을 함께 해볼까요?</h1>
        <p>업무 목적을 알려 주세요. 입력 원문을 Core에 전달하고 수신 결과를 확인합니다.</p>
        <div role="status" />
      </div> : <ChatConversation entries={entries} />}
      <div className="composer">
        <UserInputRequestForm onRequest={submit} sending={state.status === "sending"} examples={entries.length === 0 ? [workflows[1], workflows[2], workflows[0]] : undefined} />
      </div>
    </main>
  );
}
