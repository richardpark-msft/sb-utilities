const { createSenderFromFirstArg, loadArgFromFileOrText, shutdownClients } = require("./cli");
const { createInterface } = require("readline");

const sender = createSenderFromFirstArg("send");

const something = createInterface({
    terminal: false,
    input: process.stdin,
    output: process.stdout
});

/** @type {Promise<any>[]} */
const sendPromises = [];

something.on('line', (line) => {
    sendPromises.push(sender.sendMessages(loadArgFromFileOrText(line)));
});

something.on('close', () => {
    Promise.all(sendPromises)
        .catch((err) => {
            console.error(err);
        })
        .then(() => {
            shutdownClients()
        }).finally(() => {
            process.exit(1);
        });
});
