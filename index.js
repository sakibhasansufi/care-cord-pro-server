const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wsx2mog.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const campCollection = client.db("medical").collection("camp")
        const joinCampCollection = client.db("medical").collection("joincamp")
        const joinCollection = client.db("medical").collection("join")
        const usersCollection = client.db("medical").collection("users")




        // jwt related api
        app.post('/jwt',async(req,res)=>{
            const user = req.body;
            const token = jwt.sign()
        })

        // user related

        app.get('/users',async(req,res)=>{
            const result = await usersCollection.find().toArray();
            res.send(result);
        })


        app.patch('/users/admin/:id',async(req,res)=>{
            const id =req.params.id;
            const filter = {_id : new ObjectId(id)};
            const updatedDoc ={
                $set:{
                    role : 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter,updatedDoc);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const users = req.body;
            const query = { email: users.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "user already exist", insertedId: null })
            }
            const result = await usersCollection.insertOne(users);
            res.send(result);
        })

        //camp
        app.get('/camp', async (req, res) => {
            const result = await campCollection.find().toArray();
            res.send(result);
        })


        app.post('/camp', async (req, res) => {
            const data = req.body;
            const result = await campCollection.insertOne(data);
            res.send(result);
        })


        app.get('/camp/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await campCollection.findOne(query);
            res.send(result)

        })


        // join camp
        app.get('/joincamp', async (req, res) => {
            const result = await joinCampCollection.find().toArray();
            res.send(result);
        })
        app.post('/joincamp', async (req, res) => {
            const joinCamp = req.body;
            const result = await joinCampCollection.insertOne(joinCamp);
            res.send(result);
        })


        //join
        app.get('/join', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await joinCampCollection.find(query).toArray();
            res.send(result);

        })


        app.post('/join', async (req, res) => {
            const join = req.body;
            const result = await joinCollection.insertOne(join);
            res.send(result);

        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is running')
})


app.listen(port, () => {
    console.log(`server is running on ${port}`)
})
