const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../db');
const { ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app = express();

app.use(cors());
app.use(express.json());

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.PUBLIC_API_URL}/api/auth/jwks`)
)

const verifyToken = async(req, res, next) => {
    const tokenData = await req.headers.authorization;

    if (!tokenData) {
        res.status(403).json({message: 'Unauthorized'})
    }

    const token = tokenData.split(' ')[1];
    if (!token) {
        res.status(403).json({message: 'Unauthorized'})
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    } catch (error) {
        res.status(403).json({message: error.message})
    }
}

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

app.get('/pet-detail/:id', verifyToken, async(req, res) => {
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

app.post('/user/dashboard/adoption-requests', async (req, res) => {
    try {
        const db = await connectDB();
        const newAdopt = req.body;
        const { userEmail, petId } = newAdopt;

        const existingRequest = await db.collection('adoption-requests').findOne({ 
            userEmail: userEmail, 
            petId: petId 
        });

        if (existingRequest) {
            return res.status(400).json({ 
                success: false, 
                message: "You have already submitted an adoption request for this pet!" 
            });
        }

        const result = await db.collection('adoption-requests').insertOne(newAdopt);

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/user/dashboard/adoption-requests/:petId', async (req, res) => {
    try {
        const db = await connectDB();
        const petId = req.params.petId;
        
        const requests = await db.collection('adoption-requests')
            .find({ petId: petId })
            .toArray();
            
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.patch('/user/dashboard/adoption-requests/approve/:id', async (req, res) => {
    try {
        const db = await connectDB();
        const requestId = req.params.id;
        
        const request = await db.collection('adoption-requests').findOne({ _id: new ObjectId(requestId) });
        if (!request) return res.status(404).json({ message: "Request not found" });

        await db.collection('pets').updateOne(
            { _id: new ObjectId(request.petId) },
            { $set: { status: 'adopted' } }
        );

        await db.collection('adoption-requests').updateOne(
            { _id: new ObjectId(requestId) },
            { $set: { status: 'approved' } }
        );

        res.status(200).json({ success: true, message: "Request Approved Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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

app.get('/user/dashboard/my-listings/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const db = await connectDB();
        
        const myPets = await db.collection('pets').find({ ownerEmail: email }).toArray();

        res.status(200).json({ success: true, data: myPets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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