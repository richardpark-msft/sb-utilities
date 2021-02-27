import { AppConfigurationClient } from "@azure/app-configuration";
import yargs from "yargs";
import * as dotenv from "dotenv";
import { DefaultAzureCredential } from "@azure/identity";
import { getConnectionStringFromEnvironment } from "../../../shared/sharedAuth";

export interface AuthenticationArgs {
  connectionstring: string | undefined;
  env: boolean | undefined;
  server: string | undefined;
}

export function authenticationBuilder(yargs: yargs.Argv<{}>): yargs.Argv<AuthenticationArgs> {
  return yargs.options({
    "connectionstring": {
      group: "Authentication:",
      string: true,
      nargs: 1,
      conflicts: ["env", "server"]
    },
    "env": {
      group: "Authentication:",
      description:
        "Load a .env file from the specified directory, then look for APPCONFIG_CONNECTION_STRING in the environment",
      boolean: true,
      conflicts: ["connectionstring", "server"]
    },
    "server": {
      group: "Authentication:",
      alias: ["ns"],
      description:
        "Service Bus server name. Automatically uses the DefaultAzureCredential for authentication",
      string: true,
      nargs: 1,
      conflicts: ["connectionstring", "env"]
    }
  });
}

export function createAppConfigClient(parsedArgs: AuthenticationArgs): AppConfigurationClient {
  if (parsedArgs.connectionstring) {
    return new AppConfigurationClient(parsedArgs.connectionstring);
  } else if (parsedArgs.env) {
    dotenv.config();
    return new AppConfigurationClient(getConnectionStringFromEnvironment("APPCONFIG_CONNECTION_STRING"));
  } else if (parsedArgs.server) {
    return new AppConfigurationClient(parsedArgs.server, new DefaultAzureCredential());
  } else {
    throw new Error("No authentication method specified");
  }
}

