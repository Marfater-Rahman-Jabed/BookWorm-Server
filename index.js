const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');

const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.4jznvny.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function sendBookingEmail(payment) {
    const { email, price, BookName, transectionId } = payment
    const auth = {
        auth: {
            api_key: process.env.PRIVATE_API,
            domain: process.env.EMAIL_DOMAIN
        }
    }
    const transporter = nodemailer.createTransport(mg(auth));
    transporter.sendMail({
        from: "jabedcouict@gmail.com", // verified sender email
        to: `${email}`, // recipient email
        subject: `Successfull payment`, // Subject line
        text: "Hello world!", // plain text body
        html: `
        <p>Please visit us on ${transectionId} ${BookName} ${price} at </p>
        <p>Thanks from Doctors Portal</p>
        
        `, // html body
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}



async function run() {
    try {

        const categoryCoolection = client.db('UsedBook').collection('CategoryCollection');
        const BookCollection = client.db('UsedBook').collection('BookCollection');
        const UserCollection = client.db('UsedBook').collection('UserCollection');
        const BookingCollection = client.db('UsedBook').collection('BookingCollection');
        const SellerBookCollection = client.db('UsedBook').collection('SellerBookCollection');
        const AdvertiseCollection = client.db('UsedBook').collection('AdvertiseCollection');
        const PaymentCollection = client.db('UsedBook').collection('PaymentCollection');




        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCoolection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/book/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _categoryid: (id)
            }
            const cursor = BookCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.put('/book', async (req, res) => {

            const query = req.body;
            // console.log(query)
            const result = await BookCollection.updateOne(
                {
                    _id: new ObjectId(query.CategoryId)
                },
                {
                    $push: { friends: query }
                })
            res.send(result);

        })

        app.post('/sellerbook', async (req, res) => {
            const query = req.body;
            const result = await SellerBookCollection.insertOne(query);
            res.send(result);
        })

        app.get('/myproduct', async (req, res) => {
            const email = req.query;
            console.log(email.email)
            const query = { email: email.email };
            // console.log(query)
            const cursor = SellerBookCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {
                email: email
            };
            const user = await UserCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })

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
        app.get('/allseller', async (req, res) => {
            const query = { role: 'seller' };
            const cursor = UserCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/allbuyer', async (req, res) => {
            const query = { role: 'buyer' };
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

        app.get('/alluser/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await UserCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/alluser/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await UserCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        })
        app.get('/alluser/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await UserCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })
        app.get('/alluser/verifyed/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await UserCollection.findOne(query);
            res.send({ isVerifyed: user?.verifyed === 'verifyed' });
        })

        app.delete('/alluser/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await UserCollection.deleteOne(query);
            res.send(result);
        })

        app.put('/alluser/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verifyed: 'verifyed'
                }
            }
            const result = await UserCollection.updateOne(filter, updateDoc, options)
            res.send(result);


        })
        app.put('/category/update/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
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
        app.get('/orders', async (req, res) => {
            const email = req.query;
            // console.log(email.email)
            const query = { email: email.email }
            const cursor = BookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create(
                {
                    amount: amount,
                    currency: 'usd',
                    "payment_method_types": [
                        "card"
                    ],

                }
            );
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        });

        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await PaymentCollection.insertOne(payment);
            const bookingId = payment.bookingId;
            const filter = { _id: new ObjectId(bookingId) };
            updateDoc = {
                $set: {
                    paid: true
                }
            }

            const UpdateBooking = await BookingCollection.updateOne(filter, updateDoc)
            sendBookingEmail(payment)
            res.send(result);
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await BookingCollection.findOne(filter);
            res.send(result);
        });


        app.post('/advertise', async (req, res) => {
            const doc = req.body;
            const result = await AdvertiseCollection.insertOne(doc);
            res.send(result);
        })
        app.get('/advertise', async (req, res) => {
            const query = {};
            const cursor = AdvertiseCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.delete('/advertise/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AdvertiseCollection.deleteOne(query);

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