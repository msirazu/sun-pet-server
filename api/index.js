const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../db');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('homepage')
})

app.get('/pets', async(req, res) => {
    const db = await connectDB();
    const data = await db.collection('pets').find().toArray();
    res.json(data);
})

module.exports = app;