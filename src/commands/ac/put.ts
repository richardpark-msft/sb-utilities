// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AppConfigurationClient, SetConfigurationSettingResponse } from "@azure/app-configuration";
import { readFromStdinAndExecute } from "../../shared/stdinHelpers";

interface PutCommandArgs {
}

export class PutCommand implements yargs.CommandModule<{}, PutCommandArgs> {
  constructor() { }

  command = "purge";
  description = "Purges all settings from an AppConfig instance";

  builder(yargs: yargs.Argv<{}>) {
    return yargs;
  }

  async handler(_args: PutCommandArgs): Promise<void> {
    dotenv.config();

    const client = new AppConfigurationClient(process.env.APPCONFIG_CONNECTION_STRING!);

    const promises: Promise<SetConfigurationSettingResponse>[] = [];

    readFromStdinAndExecute("onceAtEnd", (message) => {
      const setting = JSON.parse(message);
      promises.push(client.setConfigurationSetting(setting));
    });

    await Promise.all(promises);
  }
}

