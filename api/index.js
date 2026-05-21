const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../db');
const { ObjectId } = require('mongodb');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({success: true, message: 'API Server is Running', version: '1.0.0'});
})

app.get('/pets', async(req, res) => {
    try {
        const db = await connectDB();
        const pets = await db.collection('pets').find().toArray();

        res.status(200).json({success: true, count: pets.length, data: pets});
    } catch(error) {
        res.status(500).json({success: false, message: error.message})
    }
})

app.get('/featured', async(req, res) => {
    try {
        const db = await connectDB();
        const fPets = await db.collection('pets').find().limit(6).toArray();

        res.status(200).json({success: true, count: fPets.length, data: fPets});
    } catch(error) {
        res.status(500).json({success: false, message: error.message})
    }
})

app.get('/pet-detail/:id', async(req, res) => {
    try {
        const id = req.params.id;
        const db = await connectDB();
        const query = {
            _id: new ObjectId(id)
        }
        const pet = await db.collection('pets').findOne(query);

        res.status(200).json({success: true, data: pet});
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
});

app.post('/pets', async(req, res) => {
    try {
        const db = await connectDB();
        const newPet = req.body;
        const result = await db.collection('pets').insertOne(newPet);

        res.status(201).json({success: true, data: result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.delete('/pet-detail/:id', async(req, res) => {
    try {
        const db = await connectDB();
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await db.collection('pets').deleteOne(query);
        res.status(200).json({success: true, data: result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

module.exports = app;