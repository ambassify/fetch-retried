# fetch-retried

Use the fetch API to run requests, implementing retries

## Installation

```shell
npm install --save @ambassify/fetch-retried
```

## Usage

You can use the fetch api as per usual. The only thing different is the source
of your fetch method. Here you use fetchRetried to create a fetch method that
will use your desired config.

```javascript
const fetchRetried = require('@ambassify/fetch-retried');
const fetch = fetchRetried({ delay: 100 });

fetch('https://www.google.com')
    .then(resp => resp.json())
    .then(json => console.log(json));
```

## Options

All options are optional and have default values.

 - **delay**: When using the default `exponential` backoff, the delay used to calculate the timeout. Otherwise a method that calculated the timeout used. (default: `200`)
 - **retries**: The number of times to retry a request. (default: `5`)
 - **isOK**: A method that determines whether a request succeeded by returning `true` or `false` when passed a response. (default: `(resp) => resp.ok`)
 - **shouldRetryError**: When fetch throws an error this method determines whether the request is retried by returning `true` or `false` (default: `() => true`)
 - **retryMethods**: Which HTTP verbs to retry (default: `['PUT', 'DELETE', 'GET', 'HEAD', 'PATCH', 'OPTIONS']`).
 - **shouldRetry**: Allows you to override the default method to check if a retry should be tried. Takes a function that accepts the following signature: `shouldRetry(url, requestOptions, { attempts, config, error, response })`.
 - **fetch**: The underlying fetch implementation to use. (default: `require('node-fetch')`)

### Backoff strategies

Strategies are attached to the default import of this package and can be accessed using.

```javascript
const fetchRetried = require('@ambassify/fetch-retried');

fetchRetried.exponential;
// OR
fetchRetried.binaryExponential;

// Usage:
const fetch = fetchRetried({
    delay: fetchRetried.exponential(10)
})
// OR
const fetch = fetchRetried({
    delay: fetchRetried.binaryExponential()
})
```

**exponential**
```javascript
function exponential(delay) {
    return (attempts) => (attempts * attempts) * delay;
}
```

**binaryExponential**
```javascript
function binaryExponential(delay = 1) {
    return (attempts) => (Math.pow(2, attempts) - 1) * delay;
}
```

## Helpers

The same building blocks the default retry logic uses are attached to the
default import, so you can reuse them when writing a custom `shouldRetry`.

```javascript
const fetchRetried = require('@ambassify/fetch-retried');
```

 - **`defaultShouldRetry(url, requestOptions, options)`**: The default retry
   decision. Returns `false` once retries are exhausted, the response passes
   `isOK`, `shouldRetryError` rejects the error, or the method is not in
   `retryMethods`. Call it as the fallback in your own `shouldRetry` to keep the
   default behaviour for cases you don't handle. `options` is
   `{ attempts, config, error, response }`.

 - **`isConnectError(err)`**: Returns `true` when an error happened during the
   connection phase (DNS failure, connection refused, TLS handshake, undici
   `onConnect*` frames, or an `AggregateError` where every error qualifies).
   These requests never reached the server, so they are safe to retry even on
   non-idempotent methods. The recognised early-stage codes are exposed on
   `isConnectError.EARLY_STAGE_NET_ERRORS`.

 - **`isRetryableMethod(retryMethods, method)`**: Returns `true` when `method`
   (default `GET`) is present in the `retryMethods` array. Case-insensitive.

 - **`IDEMPOTENT_HTTP_METHODS`**: The default `retryMethods` array —
   `['PUT', 'DELETE', 'GET', 'HEAD', 'PATCH', 'OPTIONS']`. Also available as
   `isRetryableMethod.IDEMPOTENT_HTTP_METHODS`.

 - **`hasRetriesLeft(retries, attempts)`**: Returns `attempts < retries`
   (`retries` defaults to `5`).

 - **`isValidResponse(resp)`**: The default `isOK`. Returns `true` for responses
   without a status or with a status below `500` (i.e. only `5xx` and failed
   requests are retried).

### Composing a custom `shouldRetry`

Retry connection errors on top of the default behaviour:

```javascript
const {
    isConnectError,
    defaultShouldRetry,
    IDEMPOTENT_HTTP_METHODS,
} = require('@ambassify/fetch-retried');

function shouldRetry(url, requestOptions, options) {
    const { error } = options;

    // Connection-phase errors never sent the request, retry regardless of method.
    if (isConnectError(error))
        return true;

    return defaultShouldRetry(url, requestOptions, options);
}

const fetch = fetchRetried({
    retries: 2,
    shouldRetry,
    retryMethods: IDEMPOTENT_HTTP_METHODS,
});
```

## Contribute

We really appreciate any contribution you would like to make, so don't
hesitate to report issues or submit pull requests.

## License

This project is released under a MIT license.

## About us

If you would like to know more about us, be sure to have a look at [our website](https://www.ambassify.com), or our Twitter accounts [Ambassify](https://twitter.com/Ambassify), [Sitebase](https://twitter.com/Sitebase), [JorgenEvens](https://twitter.com/JorgenEvens)

