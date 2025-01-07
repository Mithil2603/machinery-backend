const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const db = require("./db/db");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/user.routes");
const machineryRoutes = require("./routes/machinery.routes");

const PORT = process.env.PORT || 9000;
const app = express();

// Create a Nodemailer transporter using your email service (e.g., Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail", // You can change this if you're using a different provider
  auth: {
    user: "mithilsuthar2603@gmail.com", // Your email address here
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3000"], // Replace with your frontend's URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/", machineryRoutes);

// Route to handle sending inquiries
app.post("/send-inquiry", async (req, res) => {
  const { email, inquiry } = req.body;

  const mailOptions = {
    from: email,
    to: "mithilsuthar2603@gmail.com", // The email address you want to send to
    subject: "New Inquiry",
    text: `Inquiry from ${email}:\n\n${inquiry}`,
  };

  try {
    await transporter.sendMail(mailOptions); // Send the email using the transporter
    res.status(200).json({ message: "Inquiry sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error); // Log the actual error
    res.status(500).json({ error: "Error sending inquiry." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
