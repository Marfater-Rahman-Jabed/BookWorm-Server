const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');

const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');
const SSLCommerzPayment = require('sslcommerz-lts');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const store_id = process.env.STORE_ID;
const store_passwd = process.env.SSL_PASSWORD;
const is_live = false //true for live, false for sandbox


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.4jznvny.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function sendBookingEmail(payment) {
    const { email, price, BookName, transectionId, sellerEmail, sellerPhone } = payment
    const auth = {
        auth: {
            api_key: process.env.PRIVATE_API,
            domain: process.env.MAILER_DOMAIN
        }
    }
    const transporter = nodemailer.createTransport(mg(auth));
    transporter.sendMail({
        from: "jabedcouict@gmail.com", // verified sender email
        to: `${email}`, // recipient email
        subject: `Successfull payment`, // Subject line
        text: "Hello world!", // plain text body
        html: `
        <p>Your payment <b>${price}</b> taka is successfully done for <b> ${BookName}</b> Item </p>
        <p>Your TransectionId is : <b>${transectionId}</b> </p>
        <p>Seller Email:<b>${sellerEmail}</b></p>
        
        <p>Seller can delivered this item within <b>Two (2) </b> days. </p>
        <p>If any complain about seller ,contact with Seller (go to DashBoard and click "Contact with Seller" whatsApp icon) <br/> OR  go to website and report Admin via whatsapp(which is avaiable on website screen with whatsapp icon) </p>


        <p>Thanks from </p>
        <p>BookWorm</p>
        
        `, // html body
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function sendSellerEmail(payment) {
    const { sellerEmail, price, BookName, transectionId, name, phone, location } = payment
    const auth = {
        auth: {
            api_key: process.env.PRIVATE_API,
            domain: process.env.MAILER_DOMAIN
        }
    }
    const transporter = nodemailer.createTransport(mg(auth));
    transporter.sendMail({
        from: "jabedcouict@gmail.com", // verified sender email
        to: `${sellerEmail}`, // recipient email
        subject: `Successfull payment`, // Subject line
        text: "Hello world!", // plain text body
        html: `
        <p>Your Book  <b> ${BookName}</b> is sell successfull.Your payment <b>${price}</b> taka is successfully done.</p>
        <p>This TransectionId  : <b>${transectionId}</b> </p>
        <p> Buyer Name  : <b>${name}</b> </p>
        <p> Buyer Contact number  : <b>${phone}</b> </p>
        <p> Buyer Location  : <b>${location}</b> </p>

        <p>Please reached your product to the Buyer as soon as possible above this location during <b>TWO (2) days<b></p>


        <p>Thanks from </p>
        <p>BookWorm</p>
        
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


        app.get('/booksearch', async (req, res) => {

            const search = req.query.search
            // console.log(search)
            let query;
            if (search.length) {
                query = {
                    $text: {
                        $search: search
                    }
                }
            }

            const cursor = BookCollection.find(query);
            const result = await cursor.toArray();
            // console.log(result);
            res.send(result)
        })

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
        app.get('/allorders', async (req, res) => {
            const query = {}
            const cursor = BookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/alladvertise', async (req, res) => {
            const query = {}
            const cursor = AdvertiseCollection.find(query);
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
        app.delete('/allorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await BookingCollection.deleteOne(query);
            res.send(result);
        })
        app.delete('/alladvertise/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await AdvertiseCollection.deleteOne(query);
            res.send(result);
        })
        app.delete('/myproductdelete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await SellerBookCollection.deleteOne(query);
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

            const transectionId = new ObjectId().toString();
            const data = {
                total_amount: booking.price,
                currency: booking.currency,
                tran_id: transectionId, // use unique tran_id for each api call
                success_url: `http://localhost:5000/dashboard/payment/success?transectionId=${transectionId}&BookId=${booking.BookId ? booking.BookId : ''}`,
                fail_url: `http://localhost:5000/dashboard/payment/fail?transectionId=${transectionId}`,
                cancel_url: `http://localhost:5000/dashboard/payment/cancel?transectionId=${transectionId}`,
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: booking.BookName,
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: booking.name,
                cus_email: booking.email,
                cus_add1: booking.location,
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: booking.phone,
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })
                console.log('Redirecting to: ', GatewayPageURL)
            });
            BookingCollection.insertOne({
                ...booking, transectionId, paid: false
            })
            // res.send(result);
        })

        app.post('/dashboard/payment/success', async (req, res) => {

            const { transectionId, BookId } = req.query;
            // console.log(transectionId, BookId, req);
            const getQuantity = await BookCollection.findOne({ 'friends.BookId': BookId });
            // console.log(getQuantity.friends)
            let Quantity = getQuantity.friends.filter(BooksId => BooksId.BookId === BookId);

            const lengths = Quantity[0].Qunatity - 1;
            console.log(lengths)
            // const filter = { BookId }
            // const options = { upsert: true };
            // const updateDoc = {
            //     $set: {
            //         "friends.$.Qunatity": lengths
            //     }
            // }

            const updateBookQuantity = await BookCollection.updateOne({ "friends.BookId": BookId }, {
                $set: {
                    "friends.$.Qunatity": lengths
                }
            })
            const updateSellerBookQuantity = await SellerBookCollection.updateOne({ 'BookId': BookId }, {
                $set: {
                    Qunatity: lengths
                }
            })
            const updateAdvertise = await AdvertiseCollection.updateOne({ 'BookId': BookId }, {
                $set: {
                    Qunatity: lengths
                }
            })


            const result = await BookingCollection.updateOne({ transectionId }, {
                $set: {
                    paid: true,
                    paidAt: new Date()
                }
            });

            if (result.modifiedCount > 0) {
                const orderedBooking = await BookingCollection.findOne({ transectionId })
                // console.log(orderedBooking);
                sendBookingEmail(orderedBooking)
                sendSellerEmail(orderedBooking)
                res.redirect(`http://localhost:3000/dashboard/payment/success?transectionId=${transectionId}`)
            }
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