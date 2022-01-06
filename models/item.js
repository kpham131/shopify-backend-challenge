const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ItemSchema = new Schema({
    name: String,
    quantity: Number,
    // status can be used for other things in the future
    status: String,
});

module.exports = mongoose.model('Item', ItemSchema);