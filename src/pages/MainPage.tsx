import { WorkspaceIcon } from "../layouts/WorkspaceIcon";
import { useTransmission } from "../features/user-input/hooks/useTransmission";
import UserInputRequestForm from "../features/user-input/components/UserInputRequestForm";

import SubmissionResult from "../features/user-input/components/SubmissionResult";

export default function MainPage() {
  const { state, send } = useTransmission();

  return (
    <main className="page">
      <div className="welcome">
        <div className="constellation" aria-hidden="true"><span><WorkspaceIcon name="workspace" /></span></div>
        <h1>무엇을 도와드릴까요?</h1>
        <p>자연어로 요청을 입력하세요.</p>
      </div>
      <div className="composer">
        <UserInputRequestForm onRequest={send} sending={state.status === "sending"} />
        <SubmissionResult state={state} />
      </div>
    </main>
  );
}
