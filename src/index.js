/**
 * Backoff strategies
 */
function exponential(delay) {
    return (attempts) => (attempts * attempts) * delay;
}

function binaryExponential(delay = 1) {
    return (attempts) => (Math.pow(2, attempts) - 1) * delay;
}

/**
 * Retry logic
 */
function fetchRetried(config = {}) {
    const {
        delay = 30 * 1000,
        retries = 5,
        isOK = (resp) => resp.ok,
        shouldRetryError = () => true
    } = config;

    const _fetch = config.fetch || require('node-fetch');

    const timeout = (typeof delay === 'function') ? delay : exponential(delay);

    let attempts = 0;
    function retry(url, options) {
        attempts++;

        return new Promise((resolve, reject) => setTimeout(
            () => fetch(url, options).then(resolve, reject),
            timeout(attempts)
        ));
    }

    function fetch(url, options) {
        return _fetch(url, options)
            .then(resp => {
                if (attempts >= retries)
                    return resp;

                if (isOK(resp))
                    return resp;

                return retry(url, options);
            })
            .catch(error => {
                if (attempts >= retries)
                    throw error;

                if(!shouldRetryError(error))
                    throw error;

                return retry(url, options);
            });
    }

    return fetch;
}

fetchRetried.exponential = exponential;
fetchRetried.binaryExponential = binaryExponential;

module.exports = fetchRetried;
