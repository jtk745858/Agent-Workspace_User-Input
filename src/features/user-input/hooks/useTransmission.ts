import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import type { UserInputRequest } from "../userInputRequest";

export type TransmissionState =
  | { status: "idle" }
  | { status: "sending"; request: UserInputRequest }
  | { status: "received" | "rejected"; request: UserInputRequest; response: unknown }
  | { status: "error"; request: UserInputRequest; code: "IPC_ERROR" }
  | { status: "unconfirmed"; request: UserInputRequest; code: "RESPONSE_UNCONFIRMED" };

type FinishedTransmission = Exclude<TransmissionState, { status: "idle" | "sending" }>;

const waitMs = 10_000;

export function useTransmission() {
  const [state, setState] = useState<TransmissionState>({ status: "idle" });
  const active = useRef<{ timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => () => {
    if (active.current) clearTimeout(active.current.timer);
    active.current = null;
  }, []);

  async function send(request: UserInputRequest, onFinish?: (result: FinishedTransmission) => void) {
    if (active.current) return;
    setState({ status: "sending", request });
    const deadline = performance.now() + waitMs;
    const timeout = { status: "unconfirmed", request, code: "RESPONSE_UNCONFIRMED" } as const;
    const pending = { timer: setTimeout(() => finish(timeout), waitMs) };
    active.current = pending;

    function finish(result: FinishedTransmission) {
      if (active.current !== pending) return;
      clearTimeout(pending.timer);
      active.current = null;
      const terminal = performance.now() >= deadline ? timeout : result;
      setState(terminal);
      onFinish?.(terminal);
    }

    try {
      const response: unknown = await invoke("receive_user_input", { request });
      // A resolved payload is handed to Output unchanged, even if malformed.
      const rejected = response !== null && typeof response === "object"
        && "status" in response && response.status === "rejected";
      finish({ status: rejected ? "rejected" : "received", request, response });
    } catch {
      finish({ status: "error", request, code: "IPC_ERROR" });
    }
  }

  return { state, send };
}
