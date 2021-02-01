const { printMessage, createReceiverFromFirstArg } = require("./cli");

// options:
// EOF (ie, no messages since 'x' time)
// retry on timeout?
// message body _only_?

async function main() {

    const receiver = createReceiverFromFirstArg("peek");
    
    while (true) {
        let messages = await receiver.peekMessages(10);

        for (const message of messages) {
            printMessage(message);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

