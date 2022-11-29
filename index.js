const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized access');
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
    if (error) {
      return res.status(401).send({ message: "Forbidden Access" });
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
    const bookingsCollection = client.db('carhub').collection('bookings');

    //JWT token get
    app.get('/jwt', async (req, res) => {
      const email = req.query.email;
      const user = usersCollection.findOne({ email: email });
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
        return res.send({ accessToken: token });
      }
      res.status(403).send('Unauthorized User');
    })

    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.type !== 'Admin') {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }

    //User get
    app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
      const userType = req.query.type;
      let query = {};

      if (userType === "buyer") {
        query = { type: "Buyer" }
      }

      if (userType === "seller") {
        query = { type: "Seller" }
      }

      const users = await usersCollection.find(query).toArray();
      res.send(users);
    })

    //Get specific product
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      let query = { _id: ObjectId(id) };

      const car = await productsCollection.findOne(query);
      res.send(car);
    })

    //Get specific user
    app.get('/user/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      let query = { email: email };

      const user = await usersCollection.findOne(query);
      res.send(user);
    })

    //User create
    app.post('/user', async (req, res) => {
      const email = req.body.email;
      const exists = await usersCollection.findOne({ email: email });
      if (!exists) {
        const user = await usersCollection.insertOne(req.body);
        res.send(user);
      } else {
        res.send(exists);
      }
    })

    //Product create
    app.post('/product', verifyJWT, async (req, res) => {
      const product = await productsCollection.insertOne(req.body);
      res.send(product);
    })

    //Booking get
    app.get('/bookings', verifyJWT, async (req, res) => {
      const type = req.query.type;
      const email = req.query.email;
      let query = { seller_email: email }
      if (type === 'buyer') {
        query = { buyer_email: email }
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })

    //Booking create
    app.post('/booking', async (req, res) => {
      const id = req.body.product_id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          booked: 1
        }
      }
      const result = await bookingsCollection.insertOne(req.body);
      const update = await productsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })

    //Product update
    app.put('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          advertise: 1
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })

    //Product delete
    app.delete('/product/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    })

    //category delete
    app.delete('/category/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoriesCollection.deleteOne(query);
      res.send(result);
    })

    //user delete
    app.delete('/user/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    //Make admin
    app.put('/user/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          type: 'Admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    //Get Products
    app.get('/products', async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email) {
        query = { email: email }
      }

      const products = await productsCollection.find(query).toArray();
      res.send(products);
    })

    //Get advertise Products
    app.get('/products/advertise', async (req, res) => {
      let query = { advertise: 1 };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    })

    //Get Products by category
    app.get('/category/products/:name', async (req, res) => {
      const name = req.params.name;
      query = { category: name }

      const products = await productsCollection.find(query).toArray();
      res.send([products, name]);
    })

    // Get all categories
    app.get('/categories', async (req, res) => {
      const categories = await categoriesCollection.find({}).toArray();
      res.send(categories);
    });

    // Create category
    app.post('/category', verifyJWT, verifyAdmin, async (req, res) => {
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