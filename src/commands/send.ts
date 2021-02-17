import { AbortSignalLike } from "@azure/abort-controller";
import { readFileSync } from "fs";
//import { readFileSync } from "fs";
import yargs from "yargs";
import { AuthenticationArgs, authenticationBuilder, createServiceBusClient } from "../shared/auth";
import { EOL } from "os";
import { createInterface } from "readline";

interface SendCommandArgs extends AuthenticationArgs {
  entity: string;
  full: boolean;
  file: string[];
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
      },
      "file": {
        group: "Arguments",
        description:
          "A file to send. If not specified contents are assumed to come from stdin. This option can be specified multiple times.",
        array: true,
        string: true,
        default: []
      },
      "full": {
        group: "Arguments",
        description:
          "Whether the file contents (or stdin) represent just a body or a full ServiceBusMessage object (including properties, etc..)",
        boolean: false,
        default: false
      }
    });
  }

  async handler(args: SendCommandArgs): Promise<void> {
    const serviceBusClient = createServiceBusClient(args);

    try {
      const sender = serviceBusClient.createSender(args.entity);

      if (args.file == null || args.file.length === 0) {
        const text = await new Promise<string>((resolve) => {
          const readlineInterface = createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const lines: string[] = [];

          readlineInterface.on('line', (line) => {
            lines.push(line);
          });

          readlineInterface.on('close', () => {
            resolve(lines.join(EOL));
          });
        });

        if (args.full) {
          await sender.sendMessages(JSON.parse(text), {
            abortSignal: this._abortSignal
          });
        } else {
          await sender.sendMessages({
            body: text
          }, {
            abortSignal: this._abortSignal
          });
        }
      } else {
        for (const filePath of args.file) {
          const contents = readFileSync(filePath, "binary");

          if (args.full) {
            await sender.sendMessages(JSON.parse(contents), {
              abortSignal: this._abortSignal
            });
          } else {
            await sender.sendMessages({
              body: contents
            }, {
              abortSignal: this._abortSignal
            });
          }
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