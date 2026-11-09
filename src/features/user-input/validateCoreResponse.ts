import type { UserInputRequest } from "./userInputRequest";

type RejectionCode = "INVALID_REQUEST_ID" | "INVALID_INPUT" | "INPUT_TOO_LONG";
type ValidationCode = "RESPONSE_INVALID" | "RESPONSE_MISMATCH" | "RESPONSE_TEXT_MISMATCH";

type CoreResponse =
  | { status: "received"; requestId: string; receivedText: string }
  | { status: "rejected"; requestId: string; errorCode: RejectionCode; message: string };

type ValidationResult = CoreResponse | { status: "error"; code: ValidationCode };

function hasExactFields(value: object, fields: string[]) {
  return Reflect.ownKeys(value).length === fields.length
    && fields.every(field => Object.prototype.hasOwnProperty.call(value, field));
}

function isCoreResponse(value: unknown): value is CoreResponse {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || !("requestId" in value) || typeof value.requestId !== "string" || !("status" in value)) return false;

  if (value.status === "received") {
    return hasExactFields(value, ["requestId", "status", "receivedText"])
      && "receivedText" in value && typeof value.receivedText === "string";
  }
  return value.status === "rejected" && hasExactFields(value, ["requestId", "status", "errorCode", "message"])
    && "errorCode" in value && (value.errorCode === "INVALID_REQUEST_ID"
      || value.errorCode === "INVALID_INPUT" || value.errorCode === "INPUT_TOO_LONG")
    && "message" in value && typeof value.message === "string" && value.message.trim().length > 0;
}

export function validateCoreResponse(request: UserInputRequest, response: unknown): ValidationResult {
  if (!isCoreResponse(response)) return { status: "error", code: "RESPONSE_INVALID" };
  if (response.requestId !== request.requestId) return { status: "error", code: "RESPONSE_MISMATCH" };
  if (response.status === "received" && response.receivedText !== request.rawText) {
    return { status: "error", code: "RESPONSE_TEXT_MISMATCH" };
  }
  return response;
}
