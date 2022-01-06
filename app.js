const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Item = require('./models/item');
const json2csv = require('json2csv').parse
const FileSystem = require("fs");
const e = require('express');


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
app.get('/items', paginate(Item), async (req, res) => {
    // let items = await Item.find({});
    // items = items.filter(item => item.status==='active');
    const result = res.paginatedResult;
    console.log(result)
    res.render('items/index', { result })
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

// ----------- To csv -----------
app.get('/items/tocsv', async (req, res) => {
    let items = await Item.find({});
    items = items.filter(item => item.status==='active');
    try{
        const csv = json2csv(items, {fields: ["name", "quantity"]});
        res.attachment('allItems.csv');
        res.status(200).send(csv)
    }
    catch (error) {
        console.log('error:', error.message)
        res.status(500).send(error.message)
    } 
});


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
    if(findItems.length>0 && findItems[0]._id.toString()!==id){
        res.render('items/existedItem');
    }
    else{
        const item = await Item.findByIdAndUpdate(id, { ...req.body.item });
        res.redirect(`/items/${item._id}`)
    }
});

// paging from backend
function paginate(model) {
    return async (req, res, next) => {
        let page =0
        if(!req.query.page){
            page = 1;
        }
        else{
            page = parseInt(req.query.page)
        }
      const limit = 10
  
      const start = (page - 1) * limit
      const end= page * limit
      console.log("end: "+ end)
      console.log('countDoc'+ await model.countDocuments({status: 'active'}).exec())
  
      const result = {}
  
      if (end < await model.countDocuments().exec()) {
          console.log("added")
        result.next = {
          page: page + 1,
        }
      }
      
      if (start > 0) {
        result.previous = {
          page: page - 1,
        }
      }
      try {
        result.model = await model.find({status: 'active'}).limit(limit).skip(start).exec()
        res.paginatedResult = result
        next()
      } catch (e) {
        res.status(500).json({ message: e.message })
      }
    }
  }




app.listen(3000, () => {
    console.log('Serving on port 3000')
})