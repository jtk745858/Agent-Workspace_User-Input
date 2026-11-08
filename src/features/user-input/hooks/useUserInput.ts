import { useState, type FormEvent } from "react";

import { isValidUserInput } from "../isValidUserInput";

export function useUserInput(onSubmitText: (text: string) => void) {
  const [value, setValue] = useState("");
  const isValid = isValidUserInput(value);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    onSubmitText(value);
  }

  return { value, setValue, isValid, handleSubmit };
}
