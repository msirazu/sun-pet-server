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
        const { search, species } = req.query;
        let query = {};
        if (search && search.trim() !== "") {
            query.petName = { $regex: search, $options: 'i' };
        }
        if (species && species.trim() !== "") {
            query.species = { $regex: new RegExp(`^${species}$`, 'i') };
        }
        const pets = await db.collection('pets').find(query).toArray();

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

app.post('/user/dashboard/adoption-requests', async(req, res) => {
    try {
        const db = await connectDB();
        const newAdopt = req.body;
        const result = await db.collection('adoption-requests').insertOne(newAdopt);

        res.status(201).json({success: true, data: result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

app.get('/user/dashboard/my-request', async(req, res) => {
    try {
        const db = await connectDB();
        const result = await db.collection('adoption-requests').find().toArray();

        res.status(200).json({success: true, data: result});
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

app.patch('/pet-detail/:id', async(req, res) => {
    try {
        const db = await connectDB();
        const id = req.params.id;
        const modifiedData = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedData = {
            $set: modifiedData
        }
        const result = await db.collection('pets').updateOne(filter, updatedData)

        res.status(200).json({success: true, data: result});
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
});

module.exports = app;