## Installation

npm install azure-0service=

## Authentication

`sb` can authenticate using Service Bus connection strings or Azure Identity using DefaultAzureCredential.

When using DefaultAzureCredential `sb` will be able to share authentication with the `az` CLI, as well as authentication configured within Visual Studio Code.

All commands accept one of these options for authentication:

```bash
# sources a local .env file (if available) and looks for SERVICEBUS_CONNECTION_STRING in the environment
--env       

# uses the DefaultAzureCredential (authenticate via pre-configured credential in the Azure CLI, Visual Studio Code and more!)
--namespace=<service-bus-name.servicebus.windows.net> 

# Use a connection string directly passed on the command line
--connectionstring=<service bus connection string>
```

Authentication will be abbreviated as `--authentication-method` in later examples.

# Commands

- [Sending](#send-messages-to-a-queue-or-topic)
- [Receiving](#receive-messages-from-a-queue-or-subscription)

## Send messages to a queue or topic

> NOTE: `--authentication-method` is covered in [Authentication](#authentication)


### Send a single message

`sb send` will send a message from stdin to a Service Bus topic or queue.

```bash
sb send 'queue or topic' --authentication-method < message-text
```

`message-text` should follow the format described in [Message formatting](#message-formatting)

### Send multiple messages

`sb send` can also send multiple messages at a time. 

```bash
sb send 'queue or topic' --authentication-method --multiple < message-text
```

`message-text` should have a single message per line. Each individual line will follow the same auto-detection rules described in [Message formatting](#message-formatting)

### Message formatting

`sb` accepts two types of `message-text` formats:

* If the message text is valid JSON _and_ it contains a `body` field it will be used directly as a `ServiceBusMessage`. This allows you to set other fields for the message, like `applicationProperties`:

  Example:

  ```json
  { 
    "body": "my body text",
    "messageId": "my own message id",
    "applicationProperties": {
      "origin": "Earth"
    }
  }
  ```
 * Otherwise, `sb` will create a `ServiceBusMessage` with the message text as the `body` field.

## Receive messages from a queue or subscription

> NOTE: `--authentication-method` is covered in [Authentication](#authentication)

`sb receive` will read messages from a Service Bus queue or subscription, optionally allowing for deleting the
messages after they've been ready.

```bash
# peek messages, printing them out one per line
sb receive 'queue or topic' --authentication-method

# print a line number before every received message
sb receive 'queue or topic' --linenumber --authentication-method

# ...stop if no messages are received in 30 seconds.
sb receive 'queue or topic' --maxidletime 30s --authentication-method

# ...stop after 30 seconds
sb receive 'queue or topic' --timeout 30s --authentication-method

# ...stop after receiving 10 messages
sb receive 'queue or topic' --count 10 --authentication-method

# delete messages after they are received (can be used with any of the variations above)
sb receive 'queue or topic' --delete --authentication-method
```