const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../db/db");
const { hashPassword, verifyPassword } = require("../utils/passwordUtils");
const cookieParser = require("cookie-parser");

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone_number,
    company_name,
    user_password,
    user_type,
  } = req.body;

  try {
    // Hash the password
    const hashedPassword = await hashPassword(user_password);

    // Insert user into database
    const sql = `INSERT INTO user_tbl (first_name, last_name, email, phone_number, company_name, user_password, user_type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(
      sql,
      [
        first_name,
        last_name,
        email,
        phone_number,
        company_name,
        hashedPassword,
        user_type,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "User registered successfully." });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post("/login", (req, res) => {
  const { email, user_password } = req.body;

  const sql = `SELECT * FROM user_tbl WHERE email = ?`;
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found." });

    const user = results[0];
    const isPasswordValid = await verifyPassword(
      user_password,
      user.user_password
    );

    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials." });

    // Generate a JWT token after successful login
    const token = jwt.sign(
      { userId: user.user_id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send the token in a cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000, // 1 hour expiry
    });

    res.status(200).json({ message: "Login successful." });
  });
});

// Forgot Password Route
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  const sql = `SELECT * FROM user_tbl WHERE email = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: "Email not found." });

    const user = results[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiry

    // Save token and expiry to the database
    const updateSql = `UPDATE user_tbl SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?`;
    db.query(
      updateSql,
      [resetToken, resetTokenExpires, user.user_id],
      async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Send the reset link via email (with the token in the URL)
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const resetLink = `${req.protocol}://${req.get("host")}/users/reset-password/${resetToken}`;
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset Request",
          text: `Click the link to reset your password: ${resetLink}`,
        };

        try {
          await transporter.sendMail(mailOptions);

          // Set the token as an HTTP-only cookie
          res.cookie("resetToken", resetToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only secure cookies in production
            maxAge: 60 * 60 * 1000, // 1-hour expiration
          });

          res.status(200).json({ message: "Password reset email sent." });
        } catch (err) {
          res.status(500).json({ error: "Failed to send email." });
        }
      }
    );
  });
});

// Reset Password Route
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const sql = `SELECT * FROM user_tbl WHERE reset_token = ? AND reset_token_expires > NOW()`;
  db.query(sql, [token], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(400).json({ message: "Invalid or expired token." });

    const user = results[0];
    const hashedPassword = await hashPassword(newPassword);

    const updateSql = `UPDATE user_tbl SET user_password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?`;
    db.query(updateSql, [hashedPassword, user.user_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // Clear the old token cookie after password reset
      res.clearCookie("authToken");

      // Generate a new token with the updated password
      const token = jwt.sign(
        { userId: user.user_id, userType: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Set the new token in the cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 1000, // 1 hour expiry
      });

      res.status(200).json({ message: "Password reset successfully." });
    });
  });
});

// Logout Route
router.post("/logout", (req, res) => {
  // Clear the authToken cookie
  res.clearCookie("authToken");

  // Respond with a message indicating successful logout
  res.status(200).json({ message: "Logged out successfully." });
});

module.exports = router;
