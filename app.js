const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Item = require('./models/item');

// Connect to Mongo and setup
mongoose.connect('mongodb://127.0.0.1:27017/shopify-challenge', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", ()=>{
    console.log("Database connected!")
})


const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


app.get('/', (req, res) => {
    res.render('home')
});

// ----------- Get all -----------
app.get('/items', async (req, res) => {
    let items = await Item.find({});
    items = items.filter(item => item.status==='active');
    res.render('items/index', { items })
});
// paging

// ----------- New -----------
// Create new item form
app.get('/items/new', (req, res) => {
    res.render('items/new');
})

app.post('/items', async (req, res) => {
    const item = new Item(req.body.item);
    item.status = 'active';

    // check if item is already existed
    let findItems = await Item.find({name: item.name})
    findItems = findItems.filter(findItem => findItem.status==='active');
    if(findItems.length>0){
        res.render('items/existedItem');
        return;
    }
    else{
        await item.save();
    }
    res.redirect(`/items/${item._id}`)
})

// ----------- Delete -----------
// only soft delete in case admin wants to traceback data
app.delete('/items/:id', async (req, res) => {
    await Item.findByIdAndUpdate(req.params.id, { status: 'deleted'});
    res.redirect('/items');
})
// multiple delete
app.get('/items/multipleDelete', async (req, res) => {
    let items = await Item.find({});
    items = items.filter(item => item.status==='active');
    res.render('items/multipleDelete', { items })
});
app.delete('/items/multipleDelete', async (req, res) => {
    const {deleteIds} = req.body;
    for(let id of deleteIds){
        await Item.findByIdAndUpdate(id, { status: 'deleted'});
    }
    res.redirect('/items');
})

// ----------- Show -----------
app.get('/items/:id', async (req, res,) => {
    const item = await Item.findById(req.params.id)
    if(item.status === 'deleted'){
        return res.render('notFound');
    }
    res.render('items/show', { item });
});

// ----------- Edit -----------
// Edit form
app.get('/items/:id/edit', async (req, res) => {
    const item = await Item.findById(req.params.id)
    if(item.status === 'deleted'){
        return res.render('notFound');
    }
    res.render('items/edit', { item });
})

app.put('/items/:id', async (req, res) => {
    const { id } = req.params;

    // check if new name is already existed (only check of active items)
    let findItems = await Item.find({name: req.body.item.name})
    findItems = findItems.filter(findItem => findItem.status==='active');
    if(findItems.length>0){
        res.render('items/existedItem');
    }
    else{
        const item = await Item.findByIdAndUpdate(id, { ...req.body.item });
        res.redirect(`/items/${item._id}`)
    }
});






app.listen(3000, () => {
    console.log('Serving on port 3000')
})