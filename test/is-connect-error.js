'use strict';

const assert = require('assert');

function onConnectFailed() {
    return new Error('Connect failed');
}

describe('#isConnectError', function() {

    const { isConnectError } = require('..');

    [ 'ECONNREFUSED', 'ENOTFOUND', 'ERR_TLS_CERT_ALTNAME_INVALID' ].forEach(code => {
        it(`should identify connect error codes: ${code}`, function() {
            assert(isConnectError({ code }));
        })
    });

    [ 'ECONNRESET', 'ERR_ACCESS_DENIED' ].forEach(code => {
        it(`should identify non-connect error codes: ${code}`, function() {
            assert(!isConnectError({ code }));
        })
    });

    it('should identify connect syscall errors', function() {
        assert(isConnectError({ syscall: 'connect' }));
    });

    it('should handle aggregate errors', function() {
        assert(isConnectError({
            errors: [ { syscall: 'connect' } ]
        }));
    });

    it('should handle aggregate errors with some later stage error', function() {
        assert(!isConnectError({
            errors: [
                { syscall: 'connect' },
                new Error('Some other error')
            ]
        }));
    });

    it('should detect onConnect* functions in stack trace', function() {
        assert(isConnectError(onConnectFailed()));
    });

    it('should not detect stack traces without onConnect*', function() {
        assert(!isConnectError(new Error('Some other error')));
    });

});
