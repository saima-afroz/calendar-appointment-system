const express = require('express');
const app = express();

const { db } = require('./config/db')
const { eventController } = require('./app/controllers/event');

const port = process.env.PORT || 3001;


app.use(express.json()); 

app.use('/events', eventController)



app.listen(port, function(){
    console.log('listening to the port', port);
});
