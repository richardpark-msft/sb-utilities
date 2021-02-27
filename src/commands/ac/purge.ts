// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AppConfigurationClient } from "@azure/app-configuration";
import { authenticationBuilder } from "./shared/auth";

interface PurgeCommandArgs {
  includereadonly: boolean;
}

export class PurgeCommand implements yargs.CommandModule<{}, PurgeCommandArgs> {
  constructor() { }

  command = "purge";
  description = "Purges all settings from an AppConfig instance";

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs).options({
      "includereadonly": {
        aliases: ["ro"],
        boolean: true,
        default: false,
        description: "Whether we also purge values set as read-only"
      }
    });
  }

  async handler(args: PurgeCommandArgs): Promise<void> {
    dotenv.config();

    const client = new AppConfigurationClient(process.env.APPCONFIG_CONNECTION_STRING!);

    const settings = client.listConfigurationSettings({
      fields: ["key", "label", "isReadOnly"]
    });

    for await (const setting of settings) {
      if (setting.isReadOnly && args.includereadonly) {
        await client.setReadOnly(setting, false);
      }

      await client.deleteConfigurationSetting(setting);
    }
  }
}

