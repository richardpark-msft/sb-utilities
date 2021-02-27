#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import yargs from "yargs";
import { GetCommand } from "./commands/ac/get";
import { ListCommand } from "./commands/ac/list";
import { PurgeCommand } from "./commands/ac/purge";
import { SetCommand } from "./commands/ac/put";
import { DotEnvCommand } from "./commands/ac/dotenv";

async function main() {
  yargs(process.argv.slice(2))
    .scriptName("ac")
    .command(new PurgeCommand())
    .command(new SetCommand())
    .command(new GetCommand())
    .command(new ListCommand())
    .command(new DotEnvCommand())
    .demandCommand()
    .strictCommands()
    .help()
    .argv;
}

main().catch((err) => {
  console.log(`Error: ${err}`);
  process.exit(1);
});
