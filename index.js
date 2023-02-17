const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const { query } = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.4jznvny.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const AuthHeader = req.headers.authorization;
    if (!AuthHeader) {
        return res.status(403).send('UnAuthorized Access');

    }
    const token = AuthHeader.split(' ')[0];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'forebedden' })
        };
    })
    req.decoded = decoded;
    next()
}




async function run() {
    try {

        const categoryCoolection = client.db('UsedBook').collection('CategoryCollection');
        const BookCollection = client.db('UsedBook').collection('BookCollection');
        const UserCollection = client.db('UsedBook').collection('UserCollection');
        const BookingCollection = client.db('UsedBook').collection('BookingCollection');

        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCoolection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })
        // app.put('/book', async (req, res) => {
        //     const filter = {friends};
        //     const updateDoc = {
        //         $set: {
        //             location: 'Dhaka',
        //             yearOfUses: 10,
        //             postedTime: '12-12-12',
        //             resalePrice: 500,
        //             OrginalPrice: 100
        //         }
        //     }
        //     const result = await BookCollection.updateMany(filter, updateDoc);
        //     res.send(result)

        // })
        app.get('/book/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _categoryid: (id)
            }
            const cursor = BookCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            };
            const user = await UserCollection.find(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                return res.send({ accessToken: token })

            }
            res.status(403).send({ accessToken: ' ' })

        })

        app.post('/useradd', async (req, res) => {
            const doc = req.body;
            const result = await UserCollection.insertOne(doc);
            res.send(result);
        });
        app.get('/alluser', async (req, res) => {
            const query = {};
            const cursor = UserCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.put('/alluser/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UserCollection.updateOne(filter, updateDoc, options)
            res.send(result);


        })

        app.delete('/alluser/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await UserCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/category/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: newObjectId(id)
            };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await categoryCoolection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await BookingCollection.insertOne(booking);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(error => {
    console.log(error)
});



app.get('/', (req, res) => {
    res.send('UsedBook server is running')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})