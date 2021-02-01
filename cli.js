const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");
const {readFileSync} = require("fs");
const dotenv = require("dotenv");

/** @typedef {(keyof import("@azure/service-bus").ServiceBusReceivedMessage)} ServiceBusMessageField */
/** @typedef {{ close(): Promise<void>; }} Closeable */

dotenv.config();

const connectionString = process.env.SERVICEBUS_CONNECTION_STRING;
const namespace = process.env.SERVICEBUS_NAMESPACE;
const defaultFields = /** @type {ServiceBusMessageField[]} */(process.env.SERVICEBUS_DEFAULT_FIELDS ? process.env.SERVICEBUS_DEFAULT_FIELDS.split(',') : [ "body", "messageId" ]);

/** @type {Closeable[]} */
let serviceBusClients = [];

/**
 * @param {ServiceBusClient} sbclient 
 * @returns ServiceBusClient
 */
function addServiceBusClientToClose(sbclient) {
    serviceBusClients.push(sbclient);
    return sbclient;
}

/**
 * @returns {Promise<void[]>}
 */
function shutdownClients() {
    return Promise.all(serviceBusClients.map(sbc => sbc.close()))
}

/**
 * @returns {ServiceBusClient}
 */
function createServiceBusClient() {
    if (connectionString != null) {
        return addServiceBusClientToClose(new ServiceBusClient(connectionString));
    } else if (namespace != null) {
        return addServiceBusClientToClose(new ServiceBusClient(namespace, new DefaultAzureCredential()));
    } else {
        throw new Error("Required environment variable not set. Either:\n" +
            "SERVICEBUS_CONNECTION_STRING, set to the connection string for a Service Bus namespace (or entity)\n" +
            "or\n" +
            "SERVICEBUS_NAMESPACE, set to the namespace name which we will authenticate to using @azure/identity/DefaultAzureCredential.");
    }
}

/**
 * 
 * @param {ServiceBusClient} serviceBusClient 
 * @param {string|undefined} queueOrTopicPlusSubscription - a <queue> or a <topic>/<subscription>
 */
function createReceiverFromEntity(serviceBusClient, queueOrTopicPlusSubscription) {
    if (!queueOrTopicPlusSubscription) {
        throw new Error("No queue or topic/subscription specified.");
    }

    const [baseEntity, possibleSubscription] = queueOrTopicPlusSubscription.split("/");

    if (!baseEntity) {
        throw new Error("No queue or topic/subscription specified.");
    }

    if (possibleSubscription != null) {
        return serviceBusClient.createReceiver(baseEntity, possibleSubscription, {
            receiveMode: "receiveAndDelete"
        });
    } else {
        return serviceBusClient.createReceiver(baseEntity, {
            receiveMode: "receiveAndDelete"
        });
    }
}

/**
 * 
 * @param {import("@azure/service-bus").ServiceBusReceivedMessage} message 
 * @param {ServiceBusMessageField[]} fields
 */
function printMessage(message, fields = defaultFields) {
    // /** @type {Record<(keyof import("@azure/service-bus").ServiceBusReceivedMessage), any>} */
    /** @type {any} */
    const newMessage = {};

    for (const field of fields) {
        newMessage[field] = message[field];
    }

    console.log(JSON.stringify(newMessage));
}

/**
 * @param {string} utilityName 
 */
function createReceiverFromFirstArg(utilityName) {
    try {
        return createReceiverFromEntity(createServiceBusClient(), process.argv[2]);
    } catch (err) {
        console.error(err);
        console.error(`Usage: ${utilityName} <queue or topic/subscription>`);
        process.exit(0);
    }
}

/**
 * 
 * @param {string} utilityName 
 * @returns {import("@azure/service-bus").ServiceBusSender}
 */
function createSenderFromFirstArg(utilityName) {
    try {
        const serviceBusClient = createServiceBusClient();
        const entity = process.argv[2];

        if (!entity) {
            throw new Error("No queue or topic specified.");
        }

        return serviceBusClient.createSender(entity);
    } catch (err) {
        console.error(err);
        console.error(`Usage: ${utilityName} <queue or topic> <messages to send>`);
        process.exit(0);
    }
}

/**
 * 
 * @param {string} arg A raw text string or a file (prefix with \@)
 * @returns {import("@azure/service-bus").ServiceBusMessage}
 */
function loadArgFromFileOrText(arg) {
    let text = arg;
    if (arg[0] === "@") {
        text = readFileSync(arg.slice(1)).toString();
    }

    // is the text actually a serialized ServiceBusMessage?
    try {
        const possibleMessage = /** @type {import("@azure/service-bus").ServiceBusMessage} */(JSON.parse(text));

        if (possibleMessage.body != null) {
            // let's just assume it is a service bus message
            return possibleMessage;
        }
    } catch (_err) {}

    // if there are JSON related errors or it doesn't have a 'body' field let's just assume it's text and 
    // just send it in the body.
    return {
        body: text
    };
}

process.once('SIGTERM', () => {
    shutdownClients()
        .then(() => {
            process.exit(0);
        })
        .catch ((err) => {
            console.error(err);
            process.exit(1);
        });
});

module.exports = {
    createServiceBusClient,
    createReceiverFromEntity,
    createReceiverFromFirstArg,
    createSenderFromFirstArg,
    loadArgFromFileOrText,
    defaultFields,
    printMessage,
    shutdownClients
};

