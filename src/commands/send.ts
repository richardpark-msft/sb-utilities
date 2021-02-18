import { AbortSignalLike } from "@azure/abort-controller";
import { ServiceBusMessage, ServiceBusSender } from "@azure/service-bus";

import { EOL } from "os";
import yargs from "yargs";
import { createInterface } from "readline";

import { AuthenticationArgs, authenticationBuilder, createServiceBusClient } from "../shared/auth";

interface SendCommandArgs extends AuthenticationArgs {
  entity: string;
  multiple: boolean;
}

export class SendCommand implements yargs.CommandModule<{}, SendCommandArgs> {
  constructor(private _abortSignal: AbortSignalLike) {
  }

  command = "send <entity>";
  description = "Sends the contents of files or stdin to a queue or topic";

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs).options({
      "entity": {
        group: "Arguments",
        description:
          "The queue or topic to send messages to",
        string: true,
        nargs: 1,
        demandOption: true
      }, "multiple": {
        group: "Arguments",
        alias: ["m"],
        description: "Whether the content to send is multiple messages (one per line) or a single message",
        boolean: true,
        default: false
      }
      // TODO: let user control the body type detection.
    });
  }

  async handler(args: SendCommandArgs): Promise<void> {
    const serviceBusClient = createServiceBusClient(args);

    try {
      const sender = serviceBusClient.createSender(args.entity);
      await sendMessagesFromStdin(this._abortSignal, sender, args.multiple);
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

async function sendMessagesFromStdin(abortSignal: AbortSignalLike, sender: ServiceBusSender, multiple: boolean): Promise<void> {
  return await new Promise<void>((resolve, reject) => {
    const readlineInterface = createInterface({
      input: process.stdin,
      output: process.stdin.isTTY ? process.stdout : undefined,
      terminal: process.stdin.isTTY,
    });

    const lines: string[] = [];
    // TODO: trim this as we go.
    const remainingMessages: Promise<void>[] = [];

    readlineInterface.on('line', (line) => {
      if (multiple) {
        const message = formatServiceBusReceivedMessage(line);
        remainingMessages.push(sender.sendMessages(message, { abortSignal }));
      } else {
        lines.push(line);
      }
    });

    readlineInterface.on('close', () => {
      let pendingMessagesPromise: Promise<void | void[]>;

      if (lines.length === 0) {
        pendingMessagesPromise = Promise.all(remainingMessages);
      } else {
        const message = formatServiceBusReceivedMessage(lines.join(EOL));
        pendingMessagesPromise = sender.sendMessages(message, { abortSignal });
      }

      pendingMessagesPromise
        .then(() => resolve())
        .catch((err) => reject(err));
    });
  });
}

function formatServiceBusReceivedMessage(text: string): ServiceBusMessage {
  try {
    const potentialMessage = JSON.parse(text);

    if (potentialMessage.body != null) {
      return potentialMessage;
    }
  } catch (_err) { }

  return {
    body: text
  }
}
