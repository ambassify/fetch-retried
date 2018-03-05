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

/**
 * Retry logic
 */
function fetchRetried(config = {}) {
    const {
        delay = 30 * 1000,
        retries = 5,
        isOK = (resp) => resp.ok,
        shouldRetryError = () => true,
        retryMethods = ['PUT','DELETE','GET','HEAD','PATCH','OPTIONS']
    } = config;

    const _fetch = config.fetch || require('@ambassify/fetch');

    const timeout = (typeof delay === 'function') ? delay : exponential(delay);

    function shouldRetry(url, options, attempts) {
        const {
            method = 'GET'
        } = options || {};

        if (retryMethods.indexOf(method.toUpperCase()) < 0)
            return false;

        if (attempts >= retries)
            return false;

        return true;
    }

    function execute(url, options, attempts = 0) {
        const wait = timeout(attempts);

        return sleep(wait)
            .then(() => _fetch(url, options))
            .then(resp => {
                if (!shouldRetry(url, options, attempts))
                    return resp;

                if (isOK(resp))
                    return resp;

                return execute(url, options, attempts + 1);
            }, error => {
                if (!shouldRetry(url, options, attempts))
                    throw error;

                if(!shouldRetryError(error))
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

module.exports = fetchRetried;
