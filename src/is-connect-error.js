const EARLY_STAGE_NET_ERRORS = [
    'ECONNREFUSED', // (Connection refused): No connection could be made because the target machine actively refused it.
    'ENOTFOUND', // (DNS lookup failed): Indicates a DNS failure of either EAI_NODATA or EAI_NONAME
];

function isConnectError(err) {
    if (!err)
        return false;

    // AggregateError
    if (Array.isArray(err.errors))
        return err.errors.every(isConnectError);

    // We were only in the connection phase,
    // no actual request was sent.
    if (err.syscall == 'connect')
        return true;

    // These errors could be raised during connection initialization
    // However, these are guaranteed to not have transferred the request.
    if (EARLY_STAGE_NET_ERRORS.includes(err.code))
        return true;

    // Errors in the TLS Certificate validation phase
    if (/^ERR_TLS_CERT_/.test(err.code))
        return true;

    // Attempt to detect connection phase errors from stack trace
    // The error stack in undici and TLS both contain functions matching this pattern.
    // This is a workaround for errors that we are unable to reliably identify.
    const didOccurDuringConnect = [ err, err.cause ]
        .filter(Boolean)
        .some(e => /^\s*at\s+onConnect[A-Z]/m.test(e.stack));

    if (didOccurDuringConnect)
        return true;

    return false;
}

module.exports = isConnectError;

module.exports.EARLY_STAGE_NET_ERRORS = EARLY_STAGE_NET_ERRORS;
