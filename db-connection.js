const mongoose = require("mongoose");

mongoose.connect(process.env.DB)


    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = mongoose;
