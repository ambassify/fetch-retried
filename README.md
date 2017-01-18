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
const fetch = fetchRetried({ delay: 30000 });

fetch('https://www.google.com')
    .then(resp => resp.json())
    .then(json => console.log(json));
```

## Options

All options are optional and have default values.

 - **delay**: When using the default `exponential` backoff, the delay used in to calculate the timeout. Otherwise a method that calculated the timeout used. (default: `30000`)
 - **retries**: The number of times to retry a request. (default: `5`)
 - **isOK**: A method that determines whether a request succeeded by returning `true` or `false` when passed a response. (default: `(resp) => resp.ok`)
 - **shouldRetryError**: When fetch throws an error this method determines whether the request is retried by returning `true` or `false` (default: `() => true`)
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

## Contribute

We really appreciate any contribution you would like to make, so don't
hesitate to report issues or submit pull requests.

## License

This project is released under a MIT license.

## About us

If you would like to know more about us, be sure to have a look at [our website](https://www.ambassify.com), or our Twitter accounts [Ambassify](https://twitter.com/Ambassify), [Sitebase](https://twitter.com/Sitebase), [JorgenEvens](https://twitter.com/JorgenEvens)

