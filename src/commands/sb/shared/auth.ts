// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DefaultAzureCredential } from "@azure/identity";
import { ServiceBusClient } from "@azure/service-bus";

import * as dotenv from "dotenv";
import yargs from "yargs";

/**
 * @internal
 */
export interface AuthenticationArgs {
  connectionstring: string | undefined;
  env: boolean | undefined;
  namespace: string | undefined;
}

export function authenticationBuilder(yargs: yargs.Argv<{}>): yargs.Argv<AuthenticationArgs> {
  return yargs.options({
    "connectionstring": {
      group: "Authentication:",
      string: true,
      nargs: 1,
      conflicts: ["env", "namespace"]
    },
    "env": {
      group: "Authentication:",
      description:
        "Load a .env file from the specified directory, then look for SERVICEBUS_CONNECTION_STRING in the environment",
      boolean: true,
      conflicts: ["connectionstring", "namespace"]
    },
    "namespace": {
      group: "Authentication:",
      alias: ["ns"],
      description:
        "Service Bus namespace name. Automatically uses the DefaultAzureCredential for authentication",
      string: true,
      nargs: 1,
      conflicts: ["connectionstring", "env"]
    }
  });
}

/**
 * @internal
 */
export function createServiceBusClient(parsedArgs: AuthenticationArgs) {
  if (parsedArgs.connectionstring) {
    return new ServiceBusClient(parsedArgs.connectionstring);
  } else if (parsedArgs.env) {
    dotenv.config();
    return new ServiceBusClient(getConnectionStringFromEnvironment());
  } else if (parsedArgs.namespace) {
    return new ServiceBusClient(parsedArgs.namespace, new DefaultAzureCredential());
  } else {
    throw new Error("No authentication method specified");
  }
}

function getConnectionStringFromEnvironment(): string {
  if (!process.env.SERVICEBUS_CONNECTION_STRING) {
    throw new Error("SERVICEBUS_CONNECTION_STRING was not defined in the environment");
  }

  return process.env.SERVICEBUS_CONNECTION_STRING;
}
