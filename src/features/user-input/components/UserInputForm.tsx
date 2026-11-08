import { useUserInput } from "../hooks/useUserInput";

type UserInputFormProps = {
  onSubmitText: (text: string) => void;
};

export default function UserInputForm({ onSubmitText }: UserInputFormProps) {
  const { value, setValue, isValid, handleSubmit } = useUserInput(onSubmitText);

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <label htmlFor="user-input">업무 요청</label>
      <textarea
        id="user-input"
        rows={6}
        placeholder="예: 이번 주 회의록에서 결정 사항을 정리해 줘."
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
      <button type="submit" disabled={!isValid}>전송</button>
    </form>
  );
}
