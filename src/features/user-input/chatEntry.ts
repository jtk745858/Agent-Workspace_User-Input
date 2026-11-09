import type { TransmissionState } from "./hooks/useTransmission";
import { validateCoreResponse } from "./validateCoreResponse";

const errors = {
  IPC_ERROR: "통신 오류로 Core의 수신 여부를 확인할 수 없습니다.",
  RESPONSE_UNCONFIRMED: "10초 안에 응답을 확인하지 못했습니다. Core 수신 여부는 미확인입니다.",
  RESPONSE_INVALID: "Core 응답 형식이 올바르지 않습니다.",
  RESPONSE_MISMATCH: "응답의 요청 ID가 이번 제출과 일치하지 않습니다.",
  RESPONSE_TEXT_MISMATCH: "Core가 반환한 내용이 제출 원문과 일치하지 않습니다.",
};
const reasons = {
  INVALID_REQUEST_ID: "요청 ID 형식이 올바르지 않습니다.",
  INVALID_INPUT: "입력 내용이 유효하지 않습니다.",
  INPUT_TOO_LONG: "입력 크기가 허용 범위를 초과했습니다.",
};

function describe(state: Exclude<TransmissionState, { status: "idle" }>) {
  const result = "response" in state
    ? validateCoreResponse(state.request, state.response) : state;
  switch (result.status) {
    case "sending": return { kind: result.status, message: "Core 응답 대기 중" };
    case "received": return { kind: result.status, message: "Core가 사용자 입력을 정상적으로 수신했습니다." };
    case "rejected": return { kind: result.status, message: `Core 입력 거부 · ${reasons[result.errorCode]} (${result.errorCode}) ${result.message}` };
    case "error":
    case "unconfirmed": return { kind: result.status, message: `${errors[result.code]} (${result.code})` };
  }
}


export function createChatEntry(state: Exclude<TransmissionState, { status: "idle" }>) {
  return { request: state.request, notice: describe(state) };
}

export type ChatEntry = ReturnType<typeof createChatEntry>;
