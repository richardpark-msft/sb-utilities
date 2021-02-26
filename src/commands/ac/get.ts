// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AppConfigurationClient } from "@azure/app-configuration";

interface GetCommandArgs {
  key: string;
  label?: string;
}

export class GetCommand implements yargs.CommandModule<{}, GetCommandArgs> {
  constructor() { }

  command = "get";
  description = "Get a single setting from an AppConfig instance";

  builder(yargs: yargs.Argv<{}>) {
    return yargs.options({
      "key": {
        group: "Arguments",
        description:
          "The key of the setting to retrieve",
        string: true,
        nargs: 1,
        demandOption: true
      },
      "label": {
        group: "Arguments",
        description:
          "The label of the setting",
        string: true,
        nargs: 1
      },
    });
  }

  async handler(args: GetCommandArgs): Promise<void> {
    dotenv.config();

    const client = new AppConfigurationClient(process.env.APPCONFIG_CONNECTION_STRING!);

    const setting = await client.getConfigurationSetting({
      key: args.key,
      label: args.label
    });

    console.log(JSON.stringify(setting));
  }
}

