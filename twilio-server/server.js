const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
const port = 3000;

// Use environment variables for sensitive data
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC61400b5e5c92dcfba1ff121492f04bd8';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'e01b5e15c2ede3b0098f7df260ec3af2';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+13186978270';
const client = twilio(accountSid, authToken);

// Use the CORS middleware
app.use(cors());

const corsOptions = {
    origin: 'http://192.168.100.72:5500', // Replace with your frontend origin
    methods: ['POST'], // Allow only POST requests
    allowedHeaders: ['Content-Type'], // Allow Content-Type header
  };
  
  app.use(cors(corsOptions));
  
app.use(bodyParser.json());

app.post('/send-sms', (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).send('Phone number and message are required');
  }

  client.messages
    .create({
      body: message,
      to: phoneNumber,
      from: twilioPhoneNumber,
    })
    .then((message) => res.status(200).send(`Message sent: ${message.sid}`))
    .catch((error) => {
      console.error('Error sending SMS:', error);
      res.status(500).send('Failed to send SMS');
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
