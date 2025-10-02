const isConnectError = require('./is-connect-error');
const isRetryableMethod = require('./is-retryable-method');

const { IDEMPOTENT_HTTP_METHODS } = isRetryableMethod;

/**
 * Backoff strategies
 */
function exponential(delay) {
    return (attempts) => (attempts * attempts) * delay;
}

function binaryExponential(delay = 1) {
    return (attempts) => (Math.pow(2, attempts) - 1) * delay;
}

function sleep(timeout) {
    if (timeout < 1)
        return Promise.resolve();

    return new Promise(resolve => setTimeout(resolve, timeout));
}

function hasRetriesLeft(retries = 5, attempts) {
    return attempts < retries;
}

function defaultShouldRetry(url, requestOptions, options = {}) {
    const { method } = requestOptions || {};
    const { attempts, config } = options || {};
    const {
        retries = 5,
        retryMethods = IDEMPOTENT_HTTP_METHODS,
    } = config || {};

    if (!isRetryableMethod(retryMethods, method))
        return false;

    if (!hasRetriesLeft(retries, attempts))
        return false;

    return true;
}

/**
 * Retry logic
 */
function fetchRetried(config = {}) {
    const {
        // 5 * 5 * 200
        // = 0.2s + 0.8s + 1.8s + 3.2s + 5s =
        // = 11s max wait
        delay = 200,

        // Status code handling
        // 0 is a failed request
        // 100 < 400 is a successful request
        // 400 < 500 are user errors and retries are useless
        // 500 >= server errors, retry
        isOK = (resp) => !resp.status || resp.status < 500,
        shouldRetryError = () => true,

        shouldRetry = defaultShouldRetry,
        /* These are used by defaultShouldRetry */
        // retries = 5,
        // retryMethods = ['PUT','DELETE','GET','HEAD','PATCH','OPTIONS']
    } = config;

    const _fetch = config.fetch || require('@ambassify/fetch');
    const timeout = (typeof delay === 'function') ? delay : exponential(delay);
    const hasCustomRetry = (shouldRetry !== defaultShouldRetry);

    function _shouldRetry(url, requestOptions, options) {
        if (!hasRetriesLeft(config.retries, options.attempts))
            return false;

        return shouldRetry(url, requestOptions, options);
    }

    function execute(url, options, attempts = 0) {
        const wait = timeout(attempts);

        return sleep(wait)
            .then(() => _fetch(url, options))
            .then(resp => {
                if (!_shouldRetry(url, options, { attempts, config, response: resp }))
                    return resp;

                if (!hasCustomRetry && isOK(resp))
                    return resp;

                return execute(url, options, attempts + 1);
            }, error => {
                if (!_shouldRetry(url, options, { attempts, config, error }))
                    throw error;

                if(!hasCustomRetry && !shouldRetryError(error))
                    throw error;

                return execute(url, options, attempts + 1);
            });
    }

    return function fetch(url, options) {
        // protect the `attempts` parameter
        return execute(url, options);
    }
}

fetchRetried.exponential = exponential;
fetchRetried.binaryExponential = binaryExponential;

fetchRetried.isConnectError = isConnectError;
fetchRetried.hasRetriesLeft = hasRetriesLeft;
fetchRetried.isRetryableMethod = isRetryableMethod;
fetchRetried.defaultShouldRetry = defaultShouldRetry;

fetchRetried.IDEMPOTENT_HTTP_METHODS = IDEMPOTENT_HTTP_METHODS;

module.exports = fetchRetried;
