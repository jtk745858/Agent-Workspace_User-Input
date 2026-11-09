import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { useTransmission } from "../features/user-input/hooks/useTransmission";
import UserInputRequestForm from "../features/user-input/components/UserInputRequestForm";

export default function MainPage() {
  const { state, send } = useTransmission();
  const text = state.status === "idle" ? "" : state.request.rawText;
  const receipt = text && `최근 FE 입력 처리부 전달: ${Array.from(text).length}자 · ${text.split("\n").length}줄`;
  const notice = state.status === "sending" ? "Core 응답 대기 중"
    : state.status === "error" ? "통신 오류 · 수신 여부 미확인"
    : state.status === "unconfirmed" ? "응답 시간 초과 · 수신 여부 미확인" : "";

  return (
    <main className="page">
      <div className="welcome">
        <div className="constellation" aria-hidden="true"><span><WorkspaceIcon name="workspace" /></span></div>
        <h1>무엇을 도와드릴까요?</h1>
        <p>자연어로 요청을 입력하세요.</p>
      </div>
      <div className="composer">
        <UserInputRequestForm onRequest={send} sending={state.status === "sending"} />
        <p className="receipt" role="status">{[receipt, notice].filter(Boolean).join(" · ")}</p>
      </div>
    </main>
  );
}
