## Installation

1. Download the latest azure-sdk-tools*.tgz package [sb-utilities/releases](https://github.com/richardpark-msft/sb-utilities/releases)
2. Open a command prompt/terminal
3. `npm install -g --force <package release you downloaded>`

## Authentication methods (--authentication-method)

Commands generally support multiple methods for authentication.

- [DefaultAzureCredential](#defaultazurecredential-authentication)
- [Environment variables](#environment-variable-authentication)
- [Command line](#command-line-authentication)

### DefaultAzureCredential authentication

`DefaultAzureCredential` makes it so the CLI can authenticate from several implicit authentication sources on your machine.

Here are some sources that will be used, if available: 
* Credentials from `az login`
* Visual Studio Code, if you've authenticated to Azure
* (Windows only) Visual Studio, if you've authenticated to Azure
* The standard environment variables for specifying a Managed Identity
* The token endpoint provided as part of environments like Azure App Services and Azure Functions.

And of course this also works if you're writing code as well. See more about DefaultAzureCredential here:
- [JS](https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/identity/identity/README.md)
(...others)

The credential will look like this:

```bash
# for the sb cli (service bus)
sb [command] --namespace=<service-bus-name.servicebus.windows.net>

# for the ac cli (app configuration)
ac [command] --server=<https://<appconfig instance name>.azconfig.io>
```

### Environment variable authentication

Commands can source connection information from environment variables as well. To simplify the loading of environment variables (and to prevent possible leakage of credentials in the process command line) all commands will implicitly source a .env file, loading the 
environment off disk.

Note, the .env file is optional and is only loaded if present in the current folder.

To use the environment:

```bash
# sources a local .env file (if available) and looks for SERVICEBUS_CONNECTION_STRING in the environment
sb [command] --env

# sources a local .env file (if available) and looks for APPCONFIG_CONNECTION_STRING in the environment
ac [command] --env
```

### Command line authentication

Commands that use connection strings will generally take them on the command line.

> NOTE: specifying crednetials or other secret information in the command line for a program is generally not good practice as it exposes the secrets in a way that can be seen through tools like Task Manager or `ps`.

Examples:

```bash
sb [command] --connectionstring=<service bus connection string>
ac [command] --connectionstring=<appconfig connection string>
```

# `sb` Commands

`sb` allows you to receive (peek or "receive and delete") and send streams of messages to Service Bus, to both queues, topics and subscriptions.

Commands:

- [Sending: `sb send`](#send-messages-to-a-queue-or-topic)
- [Receiving: `sb receive`](#receive-messages-from-a-queue-or-subscription)

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

# `ac` Commands

`ac` allows you to query/set keys in App Configuration. It also contains some convenience commands like `purge` or `search` for doing operations with larger sets of keys and values.

### Getting keys/values

### Saving keys/values

### Searching keys/values

### Purging


