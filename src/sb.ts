#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortController } from "@azure/abort-controller";
import yargs from "yargs";

import * as listen from "./commands/listen";
import * as send from "./commands/send";

async function main() {
  const ac = new AbortController();

  yargs(process.argv.slice(2))
    .scriptName("sb")
    .command(new listen.ListenCommand(ac.signal))
    .command(new send.SendCommand(ac.signal))
    .demandCommand()
    .strictCommands()
    .help()
    .argv;
}

main().catch((err) => {
  console.log(`Error: ${err}`);
  process.exit(1);
});

// stats
// dead letter queue mgmt
