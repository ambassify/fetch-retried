const IDEMPOTENT_HTTP_METHODS = ['PUT','DELETE','GET','HEAD','PATCH','OPTIONS'];

function isRetryableMethod(retryMethods, method = 'GET') {
    if (!Array.isArray(retryMethods))
        return false;

    return retryMethods.indexOf(method.toUpperCase()) >= 0;
}

module.exports = isRetryableMethod;
module.exports.IDEMPOTENT_HTTP_METHODS = IDEMPOTENT_HTTP_METHODS;
