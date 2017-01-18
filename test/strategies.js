const assert = require('assert');

describe('#strategies', function() {
    const fetchRetried = require('../');

    describe('##exponential', function() {
        const exponential = fetchRetried.exponential;

        [0, 1, 2, 3, 4, 5].forEach(attempts => {
            it(`Should return the expected timeout after ${attempts} attempts`, function() {
                const timeout = exponential(1)(attempts);

                assert.equal(timeout, attempts * attempts);
            })

            it(`Should return the expected timeout after ${attempts} attempts with delay 60s`, function() {
                const timeout = exponential(60000)(attempts);

                assert.equal(timeout, attempts * attempts * 60000);
            })
        })
    })

    describe('##binaryExponential', function() {
        const binaryExponential = fetchRetried.binaryExponential;

        [0, 1, 2, 3, 4, 5].forEach(attempts => {
            it(`Should return the expected timeout after ${attempts} attempts`, function() {
                const timeout = binaryExponential()(attempts);

                assert.equal(timeout, Math.pow(2, attempts) - 1);
            })

            it(`Should return the expected timeout after ${attempts} attempts with delay 1s`, function() {
                const timeout = binaryExponential(1000)(attempts);

                assert.equal(timeout, (Math.pow(2, attempts) - 1) * 1000);
            })
        })
    })
})
