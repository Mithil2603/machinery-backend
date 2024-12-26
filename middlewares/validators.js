const { body } = require("express-validator");

const validateCategory = [
  body("category_name")
    .notEmpty()
    .withMessage("Category name is required")
    .isString()
    .withMessage("Category name must be a string"),
  body("category_description")
    .optional()
    .isString()
    .withMessage("Category description must be a string"),
  body("category_img")
    .optional()
    .isJSON()
    .withMessage("Category image must be valid JSON"),
];

const validateProduct = [
  body("product_name")
    .notEmpty()
    .withMessage("Product name is required")
    .isString()
    .withMessage("Product name must be a string"),
  body("category_id")
    .notEmpty()
    .withMessage("Category ID is required")
    .isInt()
    .withMessage("Category ID must be an integer"),
  body("product_description")
    .optional()
    .isJSON()
    .withMessage("Product description must be valid JSON"),
  body("product_img")
    .optional()
    .isJSON()
    .withMessage("Product image must be valid JSON"),
];

module.exports = { validateCategory, validateProduct };
