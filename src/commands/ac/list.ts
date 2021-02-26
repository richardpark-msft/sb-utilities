// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AppConfigurationClient } from "@azure/app-configuration";

interface ListCommandArgs {
  keyFilter?: string;
  labelFilter?: string;
}

export class ListCommand implements yargs.CommandModule<{}, ListCommandArgs> {
  constructor() { }

  command = "list";
  description = "List configuration settings using key and label filters";

  builder(yargs: yargs.Argv<{}>) {
    return yargs.options({
      "keyFilter": {
        group: "Arguments",
        description:
          "The keyfilter to search with",
        string: true,
        nargs: 1
      },
      "labelFilter": {
        group: "Arguments",
        description:
          "The labelfilter to search with",
        string: true,
        nargs: 1
      },
    });
  }

  async handler(args: ListCommandArgs): Promise<void> {
    dotenv.config();

    const client = new AppConfigurationClient(process.env.APPCONFIG_CONNECTION_STRING!);

    for await (const setting of client.listConfigurationSettings({
      keyFilter: args.keyFilter,
      labelFilter: args.labelFilter
    })) {
      console.log(JSON.stringify(setting));
    }

  }
}

