require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5500;
const connectDB = require('./config/db');

// Connexion à la base de données
connectDB();
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());

// Servir les fichiers du frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
    console.log(`Serveur lancé sur le port ${port}`);
});