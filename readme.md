# Machinery Management System Backend

This is the backend for the Machinery Management System. It is built using Node.js, Express, and MySQL.

## Getting Started

### Prerequisites

- Node.js
- MySQL

### Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    ```
2. Navigate to the project directory:
    ```sh
    cd Machinery-Management-System/Backend
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```

### Configuration

1. Create a [.env](http://_vscodecontentref_/3) file in the root directory and add the following environment variables:
    ```env
    PORT=9000
    HOST=localhost
    USERNAME=root
    PASSWORD=yourpassword
    DBNAME=machinary
    JWT_SECRET=yourjwtsecret
    EMAIL_USER=youremail@example.com
    EMAIL_PASS=youremailpassword
    ```

### Running the Application

Start the server:
```sh
npm start


The server will run on the port specified in the .env file (default is 9000).

API Endpoints
User Routes
POST /users/signup: Register a new user.
POST /users/login: Login a user.
POST /users/forgot-password: Request a password reset.
GET /users/reset-password/:token: Validate a password reset token.
POST /users/reset-password/:token: Reset the password.
Machinery Routes
POST /categories: Add a new category.
GET /categories: Retrieve all categories.
POST /products: Add a new product.
GET /products: Retrieve all products.
GET /products/category/:categoryId: Retrieve products by category ID.
POST /orders: Place a new order.