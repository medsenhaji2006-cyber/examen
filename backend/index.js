const express = require('express');

const app = express();
const port = 6000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(6000,(req,res)=>{console.log("serveur lance sur le port 6000")
});