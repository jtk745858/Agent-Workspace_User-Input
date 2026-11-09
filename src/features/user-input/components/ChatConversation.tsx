import { useLayoutEffect, useRef } from "react";
import type { ChatEntry } from "../chatEntry";
import SubmissionResult from "./SubmissionResult";

export default function ChatConversation({ entries }: { entries: ChatEntry[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const latest = entries[entries.length - 1];

  useLayoutEffect(() => {
    if (viewport.current && follow.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [latest]);

  return (
    <div className="conversation" ref={viewport} role="region" aria-label="대화 기록" tabIndex={0}
      onScroll={({ currentTarget }) => {
        follow.current = currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight < 40;
      }}>
      <ol>{entries.map(entry => (
        <SubmissionResult key={entry.request.requestId} entry={entry} latest={entry === latest} />
      ))}</ol>
    </div>
  );
}
