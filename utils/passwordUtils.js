const bcrypt = require('bcrypt');

// Hash a password
const hashPassword = async (plainPassword) => {
    const saltRounds = 10; // Number of salt rounds for bcrypt
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
};

// Verify a password
const verifyPassword = async (plainPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
};

module.exports = {
    hashPassword,
    verifyPassword
};
