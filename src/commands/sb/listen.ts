// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortSignalLike, AbortController } from "@azure/abort-controller";
import * as yargs from "yargs";

import { AuthenticationArgs, authenticationBuilder, createServiceBusClient } from "../shared/auth";
import { createPrintMessageFn, parseNumberThatMightBeInfinite } from "../shared/cli";
import { addTimeouts, TimeoutOptions } from "../shared/abortControllerHelpers";
import { ServiceBusReceivedMessage } from "@azure/service-bus";

interface ListenCommandArgs extends AuthenticationArgs, TimeoutOptions {
  entity: string;

  count?: string;

  linenumber: boolean;
  property: string[];

  delete: boolean;
}

export class ListenCommand implements yargs.CommandModule<{}, ListenCommandArgs> {
  constructor(private _abortSignal: AbortSignalLike) { }

  command = "receive <entity>";
  description = "Peek (and optionally delete) messages from a queue or subscription.";
  aliases = ["listen"];

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs).options({
      "entity": {
        group: "Arguments",
        description:
          "The entity to receive messages from (either: 'queue' or 'topic/subscription')",
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
      "maxidletime": {
        group: "Arguments",
        description: "The maximum amount of time to be idle before exiting",
        string: true,
        default: "infinite",
      },
      "property": {
        group: "Arguments",
        alias: ["p"],
        description: "Property to extract from the message. These can be any field in the type ServiceBusReceivedMessage and can be specified multiple times.",
        array: true,
        default: ["body", "messageId", "applicationProperties"]
      },
      "linenumber": {
        group: "Arguments",
        alias: ["n"],
        description: "Causes a leading number to be printed before each line",
        default: false,
        boolean: true
      },
      "delete": {
        group: "Arguments",
        alias: "d",
        description: "Whether to delete messages using the receiver mode 'receiveAndDelete' or peek() messages.",
        boolean: true,
        default: false
      }
    });
  }

  async handler(args: ListenCommandArgs): Promise<void> {
    const serviceBusClient = createServiceBusClient(args);
    const abortController = new AbortController(this._abortSignal);
    const timer = addTimeouts(abortController, args);

    let maxMessages: number | undefined = parseNumberThatMightBeInfinite(args.count);

    try {
      const receiver = serviceBusClient.createReceiver(args.entity, {
        receiveMode: "receiveAndDelete"   // affects nothing if we only call .peek()
      });
      const printMessage = createPrintMessageFn(args.property, args.linenumber);

      let count = 0;

      while (true) {
        let messages: ServiceBusReceivedMessage[];

        if (args.delete) {
          messages = await receiver.receiveMessages(1, {
            abortSignal: abortController.signal
          });
        } else {
          messages = await receiver.peekMessages(1, {
            abortSignal: abortController.signal
          });
        }

        timer.messageArrived();

        for (const message of messages) {
          count += 1;
          printMessage(message);
        }

        if (maxMessages != null && count >= maxMessages) {
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
      timer.clear();
    }
  }
}

