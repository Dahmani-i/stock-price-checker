const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
    this.timeout(5000); // set to 5 seconds

    test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'GOOG' })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.property(res.body.stockData, 'price');
                assert.property(res.body.stockData, 'likes');
                done();
            });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'GOOG', like: true })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.property(res.body.stockData, 'likes');
                done();
            });
    });

    test('Viewing the same stock and liking it again: likes should not double count', function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'GOOG', like: true })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.equal(res.body.stockData.stock, 'GOOG');
                assert.isAtMost(res.body.stockData.likes, 1);
                done();
            });
    });

    test('Viewing two stocks: GET request with array', function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['GOOG', 'MSFT'] })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.isArray(res.body.stockData);
                assert.equal(res.body.stockData.length, 2);
                assert.property(res.body.stockData[0], 'rel_likes');
                assert.property(res.body.stockData[1], 'rel_likes');
                done();
            });
    });

    test('Viewing two stocks and liking them', function (done) {
        chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['GOOG', 'MSFT'], like: true })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.property(res.body, 'stockData');
                assert.isArray(res.body.stockData);
                assert.equal(res.body.stockData.length, 2);
                assert.property(res.body.stockData[0], 'rel_likes');
                assert.property(res.body.stockData[1], 'rel_likes');
                done();
            });
    });

});
