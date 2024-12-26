const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const db = require('./db/db');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/user.routes');
const machineryRoutes = require("./routes/machinery.routes");

const PORT = process.env.PORT || 9000;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/', machineryRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});