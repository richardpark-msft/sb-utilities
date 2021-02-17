// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortSignalLike, AbortController } from "@azure/abort-controller";
import { readFileSync } from "fs";

/**
 * @internal
 */
export function loadArgFromFileOrText(arg: string): { body: string } {
  let text = arg;
  if (arg[0] === "@") {
    text = readFileSync(arg.slice(1)).toString();
  }

  // is the text actually a serialized ServiceBusMessage?
  try {
    const possibleMessage = /** @type {import("@azure/service-bus").ServiceBusMessage} */ JSON.parse(
      text
    );

    if (possibleMessage.body != null) {
      // let's just assume it is a service bus message
      return possibleMessage;
    }
  } catch (_err) { }

  // if there are JSON related errors or it doesn't have a 'body' field let's just assume it's text and
  // just send it in the body.
  return {
    body: text
  };
}

/**
 * @param properties 
 * @param shouldNumber 
 */
export function createPrintMessageFn(properties: string[], shouldNumber: boolean) {
  let messageNumber: number | undefined;

  if (shouldNumber) {
    messageNumber = 1;
  }

  return (message: any) => {
    const newMessage: any = {};

    for (const field of properties) {
      newMessage[field] = message[field];
    }

    if (messageNumber != null) {
      console.log(`${messageNumber++}. ${JSON.stringify(newMessage)}`);
    } else {
      console.log(JSON.stringify(newMessage));
    }
  };
}

const timeMultipliers: Record<string, number> = {
  "s": 1000,
  "m": 60 * 1000,
  "h": 60 * 60 * 1000
};

function convertTimeoutToTicks(timeout: string | "infinite" | undefined): (number | undefined) {
  if (timeout == null || timeout.length === 0) {
    throw new Error("Invalid or empty timeout value");
  }

  if (timeout === "infinite") {
    return undefined;
  }

  const match = timeout.match(/^(\d+)(s|m|h)$/);

  if (match == null || match.length != 3) {
    throw new Error(`'${timeout}' is incorrectly formatted. Examples: 2m, 1s, 3h`);
  }

  // get potential unit
  const amount = parseInt(match[1]!, 10);
  const unitCh = match[2]!;
  const unit = timeMultipliers[unitCh];

  if (unit == null) {
    throw new Error(`No time conversion for unit ${unit}`);
  }

  return amount * unit;
}

export function addTimeoutToAbortSignal(timeout: string | "infinite" | undefined, origAbortSignal: AbortSignalLike): AbortSignalLike {
  const timeoutInTicks = convertTimeoutToTicks(timeout);

  if (timeoutInTicks == null) {
    return origAbortSignal;
  } else {
    const ac = new AbortController(origAbortSignal);
    setTimeout(() => ac.abort(), timeoutInTicks);
    return ac.signal;
  }
}