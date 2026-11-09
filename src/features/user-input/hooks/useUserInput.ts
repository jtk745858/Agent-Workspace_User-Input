import { useState, type FormEvent } from "react";

import { inputValidationMessage } from "../isValidUserInput";

export function useUserInput(onSubmitText: (text: string) => void) {
  const [value, setValue] = useState("");
  const validationMessage = inputValidationMessage(value);
  const isValid = validationMessage === undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    onSubmitText(value);
  }

  return { value, setValue, isValid, validationMessage, handleSubmit };
}
