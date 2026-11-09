import type { ChatEntry } from "../chatEntry";

export default function SubmissionResult({ entry, latest }: { entry: ChatEntry; latest: boolean }) {
  const { request, notice } = entry;
  const size = `${Array.from(request.rawText).length}자 · ${request.rawText.split("\n").length}줄`;
  return (
    <li className="chat-turn" data-request-id={request.requestId}>
      <div className="chat-user">
        <span className="speaker">나</span>
        <p className="bubble">{request.rawText}</p>
      </div>
      <div className="chat-core">
        <span className="speaker">Rust Core</span>
        <div role={latest ? "status" : undefined} className="bubble" data-kind={notice.kind}>
          <p>{notice.message}</p>
          <small>{size}</small>
        </div>
      </div>
    </li>
  );
}
