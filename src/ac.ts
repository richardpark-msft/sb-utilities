#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import yargs from "yargs";
import { GetCommand } from "./commands/ac/get";
import { ListCommand } from "./commands/ac/list";
import { PurgeCommand } from "./commands/ac/purge";
import { PutCommand } from "./commands/ac/put";

async function main() {
  yargs(process.argv.slice(2))
    .scriptName("ac")
    .command(new PurgeCommand())
    .command(new PutCommand())
    .command(new GetCommand())
    .command(new ListCommand())
    .demandCommand()
    .strictCommands()
    .help()
    .argv;
}

main().catch((err) => {
  console.log(`Error: ${err}`);
  process.exit(1);
});
