import { useUserInput } from "../hooks/useUserInput";

type UserInputFormProps = {
  sending?: boolean;
  onSubmitText: (text: string) => void;
};

export default function UserInputForm({ onSubmitText, sending = false }: UserInputFormProps) {
  const { value, setValue, isValid, validationMessage, handleSubmit } = useUserInput(onSubmitText);

  const showInvalid = value.length > 0 && !isValid;

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <label htmlFor="user-input">업무 요청</label>
      <textarea
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
      <button type="submit" disabled={sending || !isValid}>전송</button>
    </form>
  );
}
