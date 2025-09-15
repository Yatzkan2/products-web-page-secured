const express = require('express');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 5000;
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,  
  handler: (req, res) => {
    const message = `Rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`;
    console.warn(message);

    res.status(429).json({
      error: "Too Many Requests",
      message
    });
  }
});
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Database setup
const DB_PATH = path.join(__dirname, 'products.db');

// Validation function
function validateProduct(name, price) {
    // Check if name exists and is not empty after trimming
    if (!name || name.trim() === '') {
        return { isValid: false, error: 'Product name is required' };
    }
    
    // Whitelist for name: only English letters (a-z, A-Z) and spaces
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
        return { isValid: false, error: 'Product name can only contain English letters and spaces' };
    }
    
    // Check if price exists
    if (!price) {
        return { isValid: false, error: 'Price is required' };
    }
    
    // Convert price to string to check character whitelist
    const priceStr = price.toString();
    
    // Whitelist for price: only numbers and decimal point
    const pricePattern = /^[0-9.]+$/;
    if (!pricePattern.test(priceStr)) {
        return { isValid: false, error: 'Price can only contain numbers and decimal point' };
    }
    
    // Check if price is a valid number and greater than 0
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
        return { isValid: false, error: 'Valid price greater than 0 is required' };
    }
    
    return { isValid: true, cleanName: name.trim(), cleanPrice: numericPrice };
}

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        // Create products table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                reject(err);
            } else {
                console.log('Products table ready');
                resolve();
            }
        });

        db.close();
    });
}




app.get('/api/products', (req, res) => {
    const searchQuery = req.query.q || '';
    const db = new sqlite3.Database(DB_PATH);
    
    let sql = 'SELECT * FROM products ORDER BY created_at DESC';
    let params = [];
    
    if (searchQuery) {
        sql = 'SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC';
        params = [`%${searchQuery}%`];
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ 
                error: 'Database error',
                message: err.message 
            });
        } else {
            console.log(`Found ${rows.length} products`);
            res.json(rows);
        }
        db.close();
    });
});

app.post('/api/products', (req, res) => {
    const { name, price } = req.body;
    
    // Validate input using the validation function
    const validation = validateProduct(name, price);
    if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
    }
    
    const db = new sqlite3.Database(DB_PATH);
    const productName = validation.cleanName;
    const productPrice = validation.cleanPrice;
    
    db.run('INSERT INTO products (name, price) VALUES (?, ?)', 
        [productName, productPrice], 
        function(err) {
            if (err) {
                console.error('Error inserting product:', err);
                res.status(500).json({ 
                    error: 'Database error',
                    message: err.message 
                });
            } else {
                console.log(`Product added: ${productName} - $${productPrice}`);
                res.status(201).json({ 
                    message: 'Product added successfully',
                    product: {
                        id: this.lastID,
                        name: productName,
                        price: productPrice
                    }
                });
            }
            db.close();
        }
    );
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Product Management API',
        endpoints: {
            'GET /api/products': 'Get all products',
            'GET /api/products?q=search': 'Search products',
            'POST /api/products': 'Create new product'
        }
    });
});

// Start server
async function startServer() {
    try {
        await initDB();
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running on port ${port}`);
            console.log(`Products API: http://localhost:${port}/api/products`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
