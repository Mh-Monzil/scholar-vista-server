const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j6yhdqz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("scholarDB").collection("users");

    // jwt generate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //clear token on logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    //save user
    app.put("/users", async (req, res) => {
        const user = req.body;
      const email = user.email;
      const query = { email: email };
      //check if user already exists in db
      const isExist = await usersCollection.findOne(query);
      if (isExist) return res.send(isExist);

      const options = {upsert: true};
      const updateDoc = {
        $set: {
            ...user
        }
      }
      const result = await usersCollection.updateOne(query,updateDoc, options);
      res.send(result);
    });

    //get all user
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    //email and password check
    app.post('/user-validation', async (req, res) => {
        const {email, password} = req.body;
        // const password = req.body.password;
        const queryEmail = {email:email};
        const emailExists = await usersCollection.findOne(queryEmail);
        if(emailExists){
            if(emailExists.password !== password){
                return res.send("Password is incorrect")
            }
        }
        return res.send("User not found")
    })








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Scholarship is available");
});

app.listen(port, console.log("Scholarship is running"));
