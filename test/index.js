const assert = require('assert');
const sinon = require('sinon');

describe('#fetchRetry', function() {

    const fetchRetried = require('..');

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    })

    it('Should not retry when not required', function() {
        const options = {
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.resolve({ ok: true });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(() => {
                assert(fetchSpy.calledOnce);
            });
    })

    it('Should retry when response not OK', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.resolve({ ok: attempts++ > 1 });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(() => {
                assert.equal(fetchSpy.callCount, 3, 'fetch called three times');
                assert.equal(attempts, 3);
            });
    })

    it('Should return response after max number of retries', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            retries: 5,
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.resolve({ ok: false, attempts: ++attempts });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(resp => {
                assert(!resp.ok, 'response not OK');
                assert.equal(resp.attempts, 6);
                assert.equal(fetchSpy.callCount, 6, 'fetch called six times');
            });
    })

    it('Should return response after max number of retries with network error', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            retries: 5,
            shouldRetryError: () => true,
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.reject({ attempts: ++attempts });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const errorSpy = sinon.spy(options, 'shouldRetryError');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(() => { throw new Error('Should throw'); }, err => {
                assert.equal(err.attempts, 6);
                assert.equal(fetchSpy.callCount, 6, 'fetch called six times');
                assert.equal(errorSpy.callCount, 5, 'shouldRetryError called five times');
            });
    })

    it('Should return response after max number of retries with network error', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            retries: 5,
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.reject({ attempts: ++attempts });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(() => { throw new Error('Should throw'); }, err => {
                assert.equal(err.attempts, 6);
                assert.equal(fetchSpy.callCount, 6, 'fetch called six times');
            });
    })

    it('Should rethrow error when expected to', function() {
        let attempts = 0;
        const options = {
            delay: 10,
            retries: 5,
            shouldRetryError: () => false,
            fetch: function(url) {
                assert.equal(url, 'https://www.google.com');

                return Promise.reject({ attempts: ++attempts });
            }
        };

        const fetchSpy = sinon.spy(options, 'fetch');
        const errorSpy = sinon.spy(options, 'shouldRetryError');
        const fetch = fetchRetried(options);

        return fetch('https://www.google.com')
            .then(() => { throw new Error('Should throw'); }, err => {
                assert.equal(err.attempts, 1);
                assert.equal(fetchSpy.callCount, 1, 'fetch called once');
                assert.equal(errorSpy.callCount, 1, 'shouldRetryError called once');
            });
    })

})


