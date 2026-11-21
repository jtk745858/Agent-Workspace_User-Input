import { WorkspaceIcon } from "../../../layouts/WorkspaceIcon";
import { useRef } from "react";
import { useUserInput } from "../hooks/useUserInput";

export type InputExample = { id: string; name: string; description: string; color: string };

type UserInputFormProps = {
  sending?: boolean;
  examples?: readonly InputExample[];
  onSubmitText: (text: string) => void;
};

export default function UserInputForm({ onSubmitText, sending = false, examples }: UserInputFormProps) {
  const { value, setValue, isValid, validationMessage, handleSubmit } = useUserInput(onSubmitText);

  const input = useRef<HTMLTextAreaElement>(null);
  const showInvalid = value.length > 0 && !isValid;

  return (
    <><form className="input-form" onSubmit={event => {
      handleSubmit(event);
      if (isValid && !sending) {
        input.current?.focus();
        input.current?.select();
      }
    }}>
      <label htmlFor="user-input">업무 요청</label>
      <textarea
        ref={input}
        id="user-input"
        aria-invalid={showInvalid}
        aria-describedby={showInvalid ? "input-guidance" : undefined}
        rows={6}
        placeholder="예: 이번 주 회의록에서 결정 사항을 정리해 줘."
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      {showInvalid && (
        <p id="input-guidance">{validationMessage}</p>
      )}
      <div className="composer-actions">
        <span className="muted">Rust Core 수신 확인</span>
        <button className="primary" type="submit" disabled={sending || !isValid}>전송</button>
      </div>
    </form>
    {examples && <section className="home-examples" aria-label="예시 업무">
      <div className="section-label"><h2>이런 업무로 시작해 보세요</h2><small>GUIDANCE &amp; SAMPLES</small></div>
      <div className="examples">{examples.map(flow =>
        <button type="button" className="example" key={flow.id} onClick={() => {
          setValue(flow.description);
          input.current?.focus();
        }}>
          <span className={`tile-icon ${flow.color}`}><WorkspaceIcon name="workflows" /></span>
          <strong>{flow.name}</strong><p>{flow.description}</p><small>입력 예시</small>
        </button>)}</div>
    </section>}
    </>
  );
}
