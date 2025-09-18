# Product Management System

Simple product management with frontend and Node.js backend.

## Quick Start

1. **Start the backend:**

   ```bash
   cd products-web-page-secured/backend
   npm install
   npm start
   ```
2. **Open frontend:**

   - Open `frontend/index.html` in your browser
   - Or open `frontend/insert-product.html` directly

## Access Points

- **Add Product**: Open `frontend/insert-product.html` in browser
- **Search Products**: Open `frontend/search-product.html` in browser
- **API Root**: [http://localhost:5000](http://localhost:5000)

## API Endpoints

### GET `/api/products`

**Purpose**: Fetch all products or search by name
**URL**: [http://localhost:5000/api/products](http://localhost:5000/api/products)
**Search**: [http://localhost:5000/api/products?q=apple](http://localhost:5000/api/products?q=apple)

### POST `/api/products`

**Purpose**: Add new product
**URL**: [http://localhost:5000/api/products](http://localhost:5000/api/products)
**Body**: `{"name": "Apple", "price": 1.99}`
