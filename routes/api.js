'use strict';

const MongoClient = require('mongodb').MongoClient;
const request = require('request');

module.exports = function (app) {
  app.route('/api/stock-prices').get(async (req, res) => {
    const stockQuery = req.query.stock;
    const like = req.query.like === 'true' || req.query.like === 'on';

    if (!stockQuery) {
      return res.status(400).json({ error: 'No stock symbol provided' });
    }

    const stocks = (Array.isArray(stockQuery) ? stockQuery : [stockQuery]).map(s => s.toUpperCase());

    let client;

    try {
      client = await MongoClient.connect(process.env.DB);
      const db = client.db("sample_mflix");
      const collection = db.collection("stocks");

      const fetchStockData = (stock) => {
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;
        return new Promise((resolve, reject) => {
          request(url, async (error, response, body) => {
            if (error) return reject('Failed to fetch stock data');
            console.log(`Stock: ${stock}, Body:`, body);

            try {
              const data = JSON.parse(body);

              if (!data.symbol || !data.latestPrice) {
                return reject('Invalid stock symbol or missing price');
              }

              const filter = { symbol: data.symbol };
              const userIP = req.ip;

              let update;
              let options = { upsert: true, returnDocument: 'after' };

              let result;

              const existing = await collection.findOne(filter);

              if (existing) {
                const alreadyLiked = existing.ips && existing.ips.includes(userIP);

                if (like && !alreadyLiked) {
                  update = {
                    $inc: { likes: 1 },
                    $addToSet: { ips: userIP },
                  };
                  result = await collection.findOneAndUpdate(filter, update, options);
                } else {
                  result = { value: existing };
                }
              } else {
                update = {
                  $setOnInsert: {
                    symbol: data.symbol,
                    likes: like ? 1 : 0,
                    ips: like ? [userIP] : [],
                  },
                };
                result = await collection.findOneAndUpdate(filter, update, options);
              }

              const doc = await collection.findOne(filter);

              if (!doc) {
                return reject('Document not found after update');
              }

              resolve({
                stock: data.symbol,
                price: data.latestPrice,
                likes: doc.likes,
              });

            } catch (e) {
              console.error('Error during DB update or parsing:', e);
              reject('Failed to parse API response');
            }
          });
        });
      };

      const stockDataList = await Promise.all(stocks.map(fetchStockData));

      if (stockDataList.length === 2) {
        const [s1, s2] = stockDataList;
        res.json({
          stockData: [
            {
              stock: s1.stock,
              price: s1.price,
              rel_likes: s1.likes - s2.likes,
            },
            {
              stock: s2.stock,
              price: s2.price,
              rel_likes: s2.likes - s1.likes,
            },
          ],
        });
      } else {
        res.json({ stockData: stockDataList[0] });
      }
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    } finally {
      if (client) {
        client.close();
      }
    }
  });
};
