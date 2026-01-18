const mongoose = require('mongoose');
require('dotenv').config();
const { Seller } = require('./models');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const sellers = await Seller.find();
        console.log('Sellers found:', sellers);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
