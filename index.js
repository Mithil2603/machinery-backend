const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const db = require('./db/db');
const userRoutes = require('./routes/user.routes');

const PORT = process.env.PORT || 9000;
const app = express();

app.use(express.json());

app.use('/users', userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});