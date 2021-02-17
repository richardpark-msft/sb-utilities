// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortSignalLike } from "@azure/abort-controller";
import * as yargs from "yargs";

import { AuthenticationArgs, authenticationBuilder, createServiceBusClient } from "../shared/auth";
import { addTimeoutToAbortSignal, createPrintMessageFn } from "../shared/cli";

interface PeekCommandArgs extends AuthenticationArgs {
  entity: string;

  count?: string;
  timeout?: string;

  linenumber: boolean;
  property: string[];
}

export class PeekCommand implements yargs.CommandModule<{}, PeekCommandArgs> {
  constructor(private _abortSignal: AbortSignalLike) { }

  command = "peek <entity>";
  description = "Peek messages from a queue or subscription";

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs).options({
      "entity": {
        group: "Arguments",
        description:
          "The entity to peek messages from (either: 'queue' or 'topic/subscription')",
        string: true,
        nargs: 1,
        demandOption: true
      },
      "count": {
        group: "Arguments",
        alias: ["c"],
        description: "The maximum number of messages to receive",
        string: true,
        default: "infinite"
      },
      "timeout": {
        group: "Arguments",
        alias: ["t"],
        description:
          "Amount of time to wait for messages before exiting. Takes precedence over 'count'.",
        string: true,
        default: "infinite",
      },
      "property": {
        group: "Arguments",
        alias: ["p"],
        description: "Property to extract from the message. These can be any field in the type ServiceBusReceivedMessage and can be specified multiple times.",
        array: true,
        default: ["body", "messageId"]
      },
      "linenumber": {
        group: "Arguments",
        alias: ["n"],
        description: "Causes a leading number to be printed before each line",
        default: false,
        boolean: true
      }
    });
  }

  async handler(args: PeekCommandArgs): Promise<void> {
    const serviceBusClient = createServiceBusClient(args);
    const abortSignal = addTimeoutToAbortSignal(args.timeout, this._abortSignal);

    let limit: number | undefined;

    if (args.count == null || args.count === "infinite") {
      limit = undefined;
    } else {
      limit = parseInt(args.count, 10);

      if (isNaN(limit)) {
        throw new Error(`Non-numeric count '${args.count}' is not allowed`);
      }
    }

    try {
      const receiver = serviceBusClient.createReceiver(args.entity);
      const printMessage = createPrintMessageFn(args.property, args.linenumber);
      let count = 0;

      while (true) {
        let messages = await receiver.peekMessages(1, {
          abortSignal
        });

        for (const message of messages) {
          printMessage(message);
        }

        count += messages.length;

        if (limit != null && count >= limit) {
          break;
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // user is just trying to stop command, non-fatal.
        return;
      } else {
        throw err;
      }
    } finally {
      await serviceBusClient.close();
    }
  }
}