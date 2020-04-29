const assert = require('assert');
const sinon = require('sinon');

describe('#bug-002', function() {

    const fetchRetried = require('..');

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    })

    it('Should attempt retries on second failing request', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            retries: 5,
            fetch: function(url) {
                assert.equal(url, 'https://example.ambassify.eu/');

                return Promise.resolve({
                    ok: false,
                    status: 500,
                    attempts: ++attempts
                });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const fetch = fetchRetried(options);

        return fetch('https://example.ambassify.eu/')
            .then(resp => {
                assert(!resp.ok, 'response not OK');
                assert.equal(resp.attempts, 6);
                assert.equal(fetchSpy.callCount, 6, 'fetch called six times');
            })
            .then(() => fetch('https://example.ambassify.eu/'))
            .then(resp => {
                assert(!resp.ok, 'response not OK');
                assert.equal(resp.attempts, 12);
                assert.equal(fetchSpy.callCount, 12, 'fetch called six additional times');
            });
    })

})


