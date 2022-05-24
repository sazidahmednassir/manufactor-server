const express = require("express");
const cors = require("cors");
const  jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nqxzh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const toolsCollection = client.db("decomputerparts").collection("tools");
    const  ordersCollection= client.db("decomputerparts").collection("orders");
    const userCollection = client.db("decomputerparts").collection("users");

    app.get("/products", async (req, res) => {
      const limit = Number(req.query.limit);
      const cursor = toolsCollection.find();

      const result = await cursor.limit(limit).toArray();

      res.send(result);
    });

    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const service = await toolsCollection.findOne(query);
      res.send(service);
  });

  app.patch('/order/:id',  async(req, res) =>{
    const id  = req.params.id;
    const orders = req.body;
    console.log(orders)
    const filter = {_id: ObjectId(id)};
    const updatedDoc = {
      $set: {
        availableQuantity: orders.newQuan,
        
      }
    }

    const result = await ordersCollection.insertOne(orders.order);
    const updatedTools = await toolsCollection.updateOne(filter, updatedDoc);
    // sendPaymentConfirmationEmail(payment)
    res.send(updatedTools);
  })

  app.get('/orders', async(req, res)=>{
    const user=req.query.user;
    const query={user:user};
    const orders= await ordersCollection.find(query).toArray();
    res.send(orders)
  })
   

  app.put('/user/:email', async(req,res)=>{
    const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7h' })
      res.send({result, token});
  })

  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello FROM DECOMPUTERPARTS!");
});

app.listen(port, () => {
  console.log(`DECOMPUTERPARTS app listening on port ${port}`);
});
