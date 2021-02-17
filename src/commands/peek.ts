// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortSignalLike } from "@azure/abort-controller";
import * as yargs from "yargs";

import { AuthCommandArgs, authenticationBuilder, createServiceBusClient } from "../shared/auth";
import { createPrintMessageFn } from "../shared/cli";

export interface PeekCommandArgs extends AuthCommandArgs {
  properties: string[];
  linenumber: boolean;
  entity: string;
  count?: number;
  timeout?: string;
}

export class PeekCommand implements yargs.CommandModule<{}, PeekCommandArgs> {
  constructor(private _abortSignal: AbortSignalLike) {
  }

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
        description:
          "The maximum number of messages to receive. Can be superceded by timeout. Defaults to -1 (infinite).",
        number: true,
        default: -1
      },
      "timeout": {
        group: "Arguments",
        description:
          "Amount of time to wait for messages before exiting. Takes precedence over 'count'.",
        string: true,
        default: "infinite",
      },
      "properties": {
        group: "Arguments",
        alias: ["p"],
        description: "Properties to extract from the message.These can be any field in the type ServiceBusReceivedMessage",
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

    try {
      const receiver = serviceBusClient.createReceiver(args.entity);
      const printMessage = createPrintMessageFn(args.properties, args.linenumber);

      while (true) {
        let messages = await receiver.peekMessages(1, {
          abortSignal: this._abortSignal
        });

        for (const message of messages) {
          printMessage(message);
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