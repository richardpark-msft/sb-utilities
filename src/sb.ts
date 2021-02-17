#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { AbortController } from "@azure/abort-controller";
import yargs from "yargs";

import * as peek from "./commands/peek";
import * as send from "./commands/send";

async function main() {
  const ac = new AbortController();

  yargs(process.argv.slice(2))
    .command(new peek.PeekCommand(ac.signal))
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

// listen
// dump

// listen --mode=peek --follow
// listen --mode=receiveAndDelete --follow
// listen --mode=peek --count=5
// listen --mode=peek --timeout=5

// stats

// dead letter queue mgmt


