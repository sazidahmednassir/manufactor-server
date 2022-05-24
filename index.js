const express = require("express");
const cors = require("cors");
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

    const result = await ordersCollection.insertOne(orders);
    const updatedTools = await toolsCollection.updateOne(filter, updatedDoc);
    // sendPaymentConfirmationEmail(payment)
    res.send(updatedTools);
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
