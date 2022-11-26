const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f3zh5ao.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    const categoriesCollection = client.db('carhub').collection('categories');
    // Get all categories
    app.get('/categories', async (res, req) => {
      const categories = await categoriesCollection.find({}).toArray();
      res.send(categories);
    });

    // Create category
    app.post('/category', async (res, req) => {
      const category = req.body;
      const result = await categoriesCollection.insertOne(data);
      res.send(result);
    });
  } finally {

  }
}

run().catch(e => console.error(e));


app.get('/', (req, res) => {
  res.send("Carhub server is running");
})

app.listen(port, () => console.log(`Server is running on port ${port}`));