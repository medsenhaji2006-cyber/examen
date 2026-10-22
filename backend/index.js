const express = require('express');

const app = express();
const port = 6000;

app.get('/', (req, res) => {
    res.send('Rah khdam mzyannnnn a mr othman!!!!!');
});
app.post('/api', (req, res) => {
    res.send('Rah khdam mzyannnnn a mr othman!!!!!');
});

app.listen(6000,(req,res)=>{console.log("serveur lance sur le port 6000")
});