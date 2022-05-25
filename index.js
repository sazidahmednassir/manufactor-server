const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();

    const toolsCollection = client.db("decomputerparts").collection("tools");
    const ordersCollection = client.db("decomputerparts").collection("orders");
    const userCollection = client.db("decomputerparts").collection("users");

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    app.get("/products", async (req, res) => {
      const limit = Number(req.query.limit);
      const cursor = toolsCollection.find();

      const result = await cursor.limit(limit).toArray();

      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: ObjectId(id) };
      const service = await toolsCollection.findOne(query);
      res.send(service);
    });

    app.post("/product", verifyJWT, verifyAdmin, async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await toolsCollection.insertOne(product);
      res.send(result);
    });

    app.delete("/product/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };

      const result = await toolsCollection.deleteOne(filter);

      res.send(result);
    });

    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const orders = req.body;
      console.log(orders);
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          availableQuantity: orders.newQuan,
        },
      };

      const result = await ordersCollection.insertOne(orders.order);
      const updatedTools = await toolsCollection.updateOne(filter, updatedDoc);
      // sendPaymentConfirmationEmail(payment)
      res.send(updatedTools);
    });

    app.get("/orders", verifyJWT, async (req, res) => {
      const user = req.query.user;
      const decodedEmail = req.decoded.email;
      if (user === decodedEmail) {
        const query = { user: user };
        const orders = await ordersCollection.find(query).toArray();
        return res.send(orders);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "7h" }
      );
      res.send({ result, token });
    });
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
