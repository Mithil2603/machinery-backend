const express = require('express');
const router = express.Router();
const db = require('../db/db');

// 1. Category Routes
// Add a new category
router.post('/categories', (req, res) => {
    const { category_name, category_description, category_img } = req.body;

    if (!category_name) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    const sql = `INSERT INTO category_tbl (category_name, category_description, category_img) VALUES (?, ?, ?)`;
    db.query(sql, [category_name, category_description, JSON.stringify(category_img)], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Category added successfully', categoryId: result.insertId });
    });
});

// Retrieve all categories
router.get('/categories', (req, res) => {
    const sql = `SELECT * FROM category_tbl`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 2. Product Routes
// Add a new product
router.post('/products', (req, res) => {
    const { category_id, product_name, product_description, product_img } = req.body;

    if (!product_name || !category_id) {
        return res.status(400).json({ error: 'Product name and category ID are required' });
    }

    const sql = `INSERT INTO product_tbl (category_id, product_name, product_description, product_img) VALUES (?, ?, ?, ?)`;
    db.query(sql, [category_id, product_name, JSON.stringify(product_description), JSON.stringify(product_img)], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    });
});

// Retrieve all products
router.get('/products', (req, res) => {
    const sql = `SELECT * FROM product_tbl`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// Retrieve products by category ID
router.get('/products/category/:categoryId', (req, res) => {
    const { categoryId } = req.params;

    const sql = `SELECT * FROM product_tbl WHERE category_id = ?`;
    db.query(sql, [categoryId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// 3. Order Placement
// Place a new order
router.post('/orders', (req, res) => {
    const { user_id, order_details } = req.body; // order_details is an array of product details

    if (!user_id || !order_details || order_details.length === 0) {
        return res.status(400).json({ error: 'User ID and order details are required' });
    }

    // Insert into order_tbl
    const sqlOrder = `INSERT INTO order_tbl (user_id) VALUES (?)`;
    db.query(sqlOrder, [user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const orderId = result.insertId;
        const orderDetailsSql = `INSERT INTO order_details_tbl (order_id, product_id, quantity, no_of_ends, creel_type, creel_pitch, bobin_length) VALUES ?`;

        const orderDetailsData = order_details.map(detail => [
            orderId,
            detail.product_id,
            detail.quantity,
            detail.no_of_ends,
            detail.creel_type,
            detail.creel_pitch,
            detail.bobin_length
        ]);

        db.query(orderDetailsSql, [orderDetailsData], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Order placed successfully', orderId });
        });
    });
});

module.exports = router;
