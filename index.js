const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware 
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://carecordpro.web.app'],
        credentials: true,
    }),
);
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
        const adminAddCollection = client.db("medical").collection("campAdd")




        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token });
        })



        // middlewares
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access token' });
            }

            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access token' });
                }
                req.decoded = decoded;
                next();
            })
        }

        // use verify admin after verify token
        const verifyAdmin = async(req,res,next) =>{
            const email = req.decoded.email;
            const query = {email : email};
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if(!isAdmin){
                return res.status(403).send({message : 'forbidden access'});
            }
            next();
        }
        


        app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
          });



        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
      
            if (email !== req.decoded.email) {
              return res.status(403).send({ message: 'forbidden access' })
            }
      
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let admin = false;
            if (user) {
              admin = user?.role === 'admin';
            }
            res.send({ admin });
          })



        app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user doesnt exists: 
            // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
              return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
          });


        



        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
              $set: {
                role: 'admin'
              }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
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



        // admin add data api 

        app.get('/campAdd',async(req,res)=>{
            const result = await adminAddCollection.find().toArray();
            res.send(result);
        })

        app.post('/campAdd',verifyToken, verifyAdmin, async(req,res)=>{
            const camp = req.body;
            const result = await adminAddCollection.insertOne(camp);
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
