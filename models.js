const mongoose = require("mongoose");
const { Schema } = mongoose;

const StockSchema = new Schema({
    symbol: { type: String, required: true, uppercase: true },
    likes: { type: [String], default: [] }
});

// Create or get existing model
const Stock = mongoose.models.Stock || mongoose.model("Stock", StockSchema);

module.exports = { Stock };
