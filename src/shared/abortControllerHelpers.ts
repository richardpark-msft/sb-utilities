import { AbortController } from "@azure/abort-controller";
import { convertTimeoutToTicks } from "./cli";

export interface TimeoutOptions {
  maxidletime?: string | undefined;
  timeout?: string | undefined;
}

export function addTimeouts(abortController: AbortController, timeouts: TimeoutOptions): {
  messageArrived: () => void,
  clear: () => void
} {
  const idleTimeout = convertTimeoutToTicks(timeouts.maxidletime);
  let idleBouncer: ReturnType<typeof addIdleTimer> | undefined;
  let maxTimeoutClear: ReturnType<typeof addMaxTimeout> | undefined;

  if (idleTimeout != null) {
    idleBouncer = addIdleTimer(abortController, idleTimeout);
  }

  const maxTimeout = convertTimeoutToTicks(timeouts.timeout);

  if (maxTimeout != null) {
    maxTimeoutClear = addMaxTimeout(abortController, maxTimeout);
  }

  return {
    messageArrived: () => {
      idleBouncer?.bounce();
    },
    clear: () => {
      idleBouncer?.clear();

      if (maxTimeoutClear) {
        maxTimeoutClear();
      }
    }
  }
}

function addIdleTimer(ac: AbortController, n: number | undefined): {
  bounce: () => void,
  clear: () => void
} {
  if (n == null) {
    return {
      bounce: () => { },
      clear: () => { }
    }
  }

  let currentTimer: ReturnType<typeof setTimeout>;
  const setFn = () => setTimeout(() => ac.abort(), n);
  const clearFn = () => clearTimeout(currentTimer);

  setFn();

  return {
    bounce: () => {
      clearFn();
      setFn();
    },
    clear: clearFn
  }
}

function addMaxTimeout(abortController: AbortController, timeout: number): () => void {
  const timer = setTimeout(() => abortController.abort(), timeout);
  return () => clearTimeout(timer);
}
