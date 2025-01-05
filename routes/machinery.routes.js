const express = require("express");
const router = express.Router();
const db = require("../db/db");
const {
  validateCategory,
  validateProduct,
} = require("../middlewares/validators");
const { validationResult } = require("express-validator");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");

// 1. Category Routes

// Retrieve all categories (Public Access)
router.get("/categories", (req, res) => {
  const sql = `SELECT * FROM category_tbl`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// Add a new category (Admin Access Only)
router.post(
  "/categories",
  isAuthenticated,
  isAdmin,
  validateCategory,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_name, category_description, category_img } = req.body;

    const sql = `INSERT INTO category_tbl (category_name, category_description, category_img) VALUES (?, ?, ?)`;
    db.query(
      sql,
      [category_name, category_description, JSON.stringify(category_img)],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          message: "Category added successfully",
          categoryId: result.insertId,
        });
      }
    );
  }
);

// 2. Product Routes

// Retrieve all products (Public Access)
router.get("/products", (req, res) => {
  const sql = `SELECT * FROM product_tbl`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// Retrieve a specific product by productId (Public Access)
router.get("/products/:productId", (req, res) => {
  const { productId } = req.params;

  const sql = `SELECT * FROM product_tbl WHERE product_id = ?`;
  db.query(sql, [productId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(result[0]);
  });
});

// Add a new product (Admin Access Only)
router.post(
  "/products",
  isAuthenticated,
  isAdmin,
  validateProduct,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_id, product_name, product_description, product_img } =
      req.body;

    const sql = `INSERT INTO product_tbl (category_id, product_name, product_description, product_img) VALUES (?, ?, ?, ?)`;
    db.query(
      sql,
      [
        category_id,
        product_name,
        JSON.stringify(product_description),
        JSON.stringify(product_img),
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          message: "Product added successfully",
          productId: result.insertId,
        });
      }
    );
  }
);

// Update product details (Admin Access Only)
router.patch("/products/:productId", (req, res) => {
  const { productId } = req.params;
  const { category_id, product_name, product_description, product_img } =
    req.body;

  const updateFields = [];
  const updateValues = [];

  if (category_id) {
    updateFields.push("category_id = ?");
    updateValues.push(category_id);
  }
  if (product_name) {
    updateFields.push("product_name = ?");
    updateValues.push(product_name);
  }
  if (product_description) {
    updateFields.push("product_description = ?");
    updateValues.push(JSON.stringify(product_description));
  }
  if (product_img) {
    updateFields.push("product_img = ?");
    updateValues.push(JSON.stringify(product_img));
  }

  if (updateFields.length === 0) {
    return res
      .status(400)
      .json({ error: "No fields provided for update" });
  }

  updateValues.push(productId);

  const sql = `UPDATE product_tbl SET ${updateFields.join(", ")} WHERE product_id = ?`;

  db.query(sql, updateValues, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product updated successfully" });
  });
});

// Retrieve products by category ID (Public Access)
router.get("/products/category/:categoryId", (req, res) => {
  const { categoryId } = req.params;

  const sql = `SELECT * FROM product_tbl WHERE category_id = ?`;
  db.query(sql, [categoryId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// 3. Order Placement

// Place a new order (Authenticated Users Only)
router.post("/orders", isAuthenticated, (req, res) => {
  const { user_id, order_details } = req.body;

  if (!user_id || !order_details || order_details.length === 0) {
    return res
      .status(400)
      .json({ error: "User ID and order details are required" });
  }

  const sqlOrder = `INSERT INTO order_tbl (user_id) VALUES (?)`;
  db.query(sqlOrder, [user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const orderId = result.insertId;
    const orderDetailsSql = `INSERT INTO order_details_tbl (order_id, product_id, quantity, no_of_ends, creel_type, creel_pitch, bobin_length) VALUES ?`;

    const orderDetailsData = order_details.map((detail) => [
      orderId,
      detail.product_id,
      detail.quantity,
      detail.no_of_ends,
      detail.creel_type,
      detail.creel_pitch,
      detail.bobin_length,
    ]);

    db.query(orderDetailsSql, [orderDetailsData], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Order placed successfully", orderId });
    });
  });
});

// Add feedback for a product (Authenticated Access - Only logged-in users can post)
router.post("/products/:productId/feedback", isAuthenticated, (req, res) => {
  // Check if the user is logged in
  if (!req.session.userId) {
    return res
      .status(403)
      .json({ error: "You must be logged in to post feedback" });
  }

  const { productId } = req.params;
  const { feedback_text, feedback_rating } = req.body;

  if (!feedback_text || !feedback_rating) {
    return res
      .status(400)
      .json({ error: "Feedback text and rating are required" });
  }

  if (feedback_rating < 1 || feedback_rating > 5) {
    return res
      .status(400)
      .json({ error: "Feedback rating must be between 1 and 5" });
  }

  const sql = `INSERT INTO feedback_tbl (product_id, feedback_text, feedback_rating, user_id) VALUES (?, ?, ?, ?)`;
  db.query(
    sql,
    [productId, feedback_text, feedback_rating, req.session.userId], // Store the user ID in the feedback
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "Feedback submitted successfully",
        feedbackId: result.insertId,
      });
    }
  );
});

// Get feedback for a product (Public Access)
router.get("/products/:productId/feedback", (req, res) => {
  const { productId } = req.params;

  const sql = `SELECT * FROM feedback_tbl WHERE product_id = ? ORDER BY feedback_date DESC`;
  db.query(sql, [productId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

module.exports = router;
