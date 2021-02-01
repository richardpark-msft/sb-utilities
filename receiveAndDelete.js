const { printMessage, createReceiverFromFirstArg } = require("./cli");

let receiver = createReceiverFromFirstArg("receiveAndDelete");

receiver.subscribe({
    processError: async (errContext) => {
        console.error(`WARNING: ${errContext.error}`);
    },
    processMessage: async (message) => {
        printMessage(message);
    }
});