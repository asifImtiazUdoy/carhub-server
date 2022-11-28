const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headears.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized access');
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(401).send({message: "Forbidden Access"});
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const categoriesCollection = client.db('carhub').collection('categories');
    const usersCollection = client.db('carhub').collection('users');
    const productsCollection = client.db('carhub').collection('products');

    //JWT token get
    app.get('/jwt', async(req, res) => {
      const email = req.query.email;
      const user = usersCollection.findOne({email: email});
      if (user) {
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
        return res.send({accessToken: token});
      }
      res.status(403).send('Unauthorized User');
    })

    //User get
    app.get('/users', async (req, res) => {
      const userType = req.query.type;
      let query = {};

      if (userType === "buyer") {
        query = { type: "Buyer"}
      }

      if (userType === "seller") {
        query = { type: "Seller"}
      }

      const users = await usersCollection.find(query).toArray();
      res.send(users);
    })

    //User create
    app.post('/user', async (req, res) => {
      const user = await usersCollection.insertOne(req.body);
      res.send(user);
    })

    //Product create
    app.post('/product', async (req, res) => {
      const product = await productsCollection.insertOne(req.body);
      res.send(product);
    })

    //Get Products
    app.get('/products', async (req, res) => {
      const email = req.query.type;
      let query = {};

      if (email) {
        query = { email: email}
      }

      const products = await productsCollection.find(query).toArray();
      res.send(products);
    })
    
    // Get all categories
    app.get('/categories', async (req, res) => {
      const categories = await categoriesCollection.find({}).toArray();
      res.send(categories);
    });

    // Create category
    app.post('/category', async (req, res) => {
      const result = await categoriesCollection.insertOne(req.body);
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