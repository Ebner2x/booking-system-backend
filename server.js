const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Update the allowed origins here
const allowedOrigins = ['https://cutting-room-website.vercel.app/#booking'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

// Booking schema 
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    barber: String,
    date: String,
    time: String,
    status: String
});
const Booking = mongoose.model('Booking', bookingSchema);

// Email configuration 
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ebner2x@gmail.com',
        pass: 'towo rivn jcgg gpbq'
    }
});

// Booking route 
app.post('/book', async (req, res) => {
    console.log('Received booking request:', req.body);
    const { name, email, barber, date, time } = req.body;
    const booking = new Booking({ name, email, barber, date, time, status: 'pending' });

    // Define the barber email based on the selected barber
    const barberEmail = {
        'Barber Robert': 'ebnerqh07@gmail.com',
        'Barber Reco': 'reco@example.com',
        'Barber Carlous': 'carlous@example.com',
        'Barber Marcus': 'marcus@example.com'
    }[barber];

    try {
        await booking.save();
        console.log('Booking saved:', booking);

        // Send email to barber
        const mailOptions = {
            from: 'ebner2x@gmail.com',
            to: barberEmail,
            subject: 'New Booking Request',
            text: `You have a new booking request from ${name} on ${date} at ${time}. Please confirm or decline.\n\n
                   Confirm: https://booking-system-backend-huj6.onrender.com/confirm/${booking._id}\n
                   Decline: https://booking-system-backend-huj6.onrender.com/decline/${booking._id}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log('Error sending email:', error);
            }
            console.log('Email sent:', info.response);
        });

        res.send('Booking request sent!');
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).send('Error saving booking');
    }
});

// Route to confirm the booking
app.get('/confirm/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        booking.status = 'confirmed';
        await booking.save();

        // Send confirmation email to the customer
        const mailOptions = {
            from: 'ebner2x@gmail.com',
            to: booking.email,
            subject: 'Booking Confirmed',
            text: `Your booking on ${booking.date} at ${booking.time} has been confirmed.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending confirmation email');
            }
            res.send('Booking confirmed and customer notified');
        });
    } catch (error) {
        res.status(500).send('Error confirming booking');
    }
});

// Route to decline the booking
app.get('/decline/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        booking.status = 'declined';
        await booking.save();

        // Send decline email to the customer
        const mailOptions = {
            from: 'ebner2x@gmail.com',
            to: booking.email,
            subject: 'Booking Declined',
            text: `Your booking on ${booking.date} at ${booking.time} has been declined.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending decline email');
            }
            res.send('Booking declined and customer notified');
        });
    } catch (error) {
        res.status(500).send('Error declining booking');
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Booking System Backend');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
