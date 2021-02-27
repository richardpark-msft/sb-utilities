// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AuthenticationArgs, authenticationBuilder, createAppConfigClient } from "./shared/auth";
import { readFromStdinAndExecute } from "../../shared/stdinHelpers";

interface DotEnvCommandArgs extends AuthenticationArgs {
  label?: string;
  mode: string;
}

export class DotEnvCommand implements yargs.CommandModule<{}, DotEnvCommandArgs> {
  constructor() { }

  command = "dotenv";
  description = "Generates a dotenv compatible file using key/values from an AppConfig instance.";

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs).options({
      // TODO: less awkward if (perhaps) it was just a sub-sub-mode of this command
      "mode": {
        aliases: "m",
        string: true,
        description: "The mode for this command. `set` a .env file as a series of key/values from stdin, or `get` to echo the settings from AppConfig as an .env file to stdout",
        choices: ["set", "get"],
        nargs: 1,
        demandOption: true
      },
      "label": {
        aliases: ["l"],
        string: true,
        nargs: 1,
        default: undefined,
        description: "The label (exact match only) to use when querying settings"
      }
    });
  }

  async handler(args: DotEnvCommandArgs): Promise<void> {
    dotenv.config();

    const client = createAppConfigClient(args);

    // squash "" to just be undefined (ie, no label)
    const label = args["label"] ? args["label"] : undefined;

    switch (args.mode) {
      case "get": {
        const settings = client.listConfigurationSettings({
          fields: ["key", "label", "value"],
          labelFilter: label
        });

        console.log(`# label=${label ?? "(no label)"}`);

        for await (const setting of settings) {
          console.log(`${setting.key}=\"${setting.value}\"`);
        }
        break;
      }
      case "set": {
        let dotEnvText: string | undefined;

        await readFromStdinAndExecute("onceAtEnd", (text) => {
          dotEnvText = text;
        });

        if (!dotEnvText) {
          return;
        }

        const output = dotenv.parse(dotEnvText);

        for (const envVar in output) {
          console.log(`envVar = ${envVar}, ${output[envVar]}`)
          await client.setConfigurationSetting({
            key: envVar,
            label: label,
            value: output[envVar]
          });
        }
        break;
      }
      default: {
        throw new Error(`Invalid mode ${args.mode}`);
      }
    }
  }
}
