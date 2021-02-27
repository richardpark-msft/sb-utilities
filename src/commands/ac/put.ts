// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as yargs from "yargs";
import * as dotenv from "dotenv";
import { AppConfigurationClient, SetConfigurationSettingResponse } from "@azure/app-configuration";
import { readFromStdinAndExecute } from "../../shared/stdinHelpers";
import { authenticationBuilder } from "./shared/auth";

interface SetCommandArgs {
}

export class SetCommand implements yargs.CommandModule<{}, SetCommandArgs> {
  constructor() { }

  command = "set";
  description = "Set a value to the AppConfig server";

  builder(yargs: yargs.Argv<{}>) {
    return authenticationBuilder(yargs);
  }

  async handler(_args: SetCommandArgs): Promise<void> {
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

