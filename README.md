# LogiTrack | Mini Logistics & Order Management System

LogiTrack is a state-of-the-art, full-stack logistics and cargo delivery order tracking platform. Inspired by the aerodynamic paper airplane circle branding, it provides an elegant dark-theme glassmorphic control console with an **interactive simulated transit radar map** (drawn dynamically via Canvas) and an active **server-side GPS simulation engine**.

---

## 1. System Architecture & Folder Layout

The platform uses a modular monorepo directory layout with strict layered separation of concerns:

```text
d:\project 3\
 ├── backend/
 │    ├── config/          # Database & configuration settings (Mongoose bootstrap)
 │    ├── controllers/     # Request validation, payload checking, controller routing dispatch
 │    ├── services/        # Query generation, pricing formulas, coordinate math, business logic
 │    ├── routes/          # REST route endpoints with express-validator middleware
 │    ├── middleware/      # JWT verification, Role authorization, centralized error parser
 │    ├── models/          # MongoDB Mongoose schemas (User & Order)
 │    ├── utils/           # Centralized AppError helpers, JWT token signing
 │    ├── server.js        # Main Express server bootstrapper & GPS simulator worker
 │    └── package.json
 ├── frontend/
 │    ├── src/
 │    │    ├── components/ # Reusable Canvas Radar Maps, Timeline guides
 │    │    ├── pages/      # Login, Signup, Customer Dashboard, Forms, Admin consoles
 │    │    ├── services/   # Axios API client wrappers with automated token injects
 │    │    ├── context/    # User authentication Context API providers
 │    │    ├── App.jsx     # Route guarding & React Router DOM setups
 │    │    ├── index.css   # Cyber-dark glassmorphism theme design sheets
 │    │    └── main.jsx    # React rendering root
 │    ├── index.html
 │    └── package.json
 ├── docker-compose.yml    # Single-command local MongoDB container deployer
 └── package.json          # Root-level multi-run concurrency settings
```

### Flow of Execution (Layered Separation)
```
[Client App] --> [REST Routing] --> [Security Middleware] --> [Controller Mapping] --> [Service Layer Logic] --> [Mongoose Database Models]
```

---

## 2. Database Design & MongoDB Schema

Optimized schemas utilizing Mongoose validators, index optimizations, and preset pre-save security hooks:

### 👤 User Collection Schema
*   **`name`**: `String` (Required, trimmed, max 50 chars).
*   **`email`**: `String` (Required, unique, lowercase, trimmed, validated via RFC email regex).
*   **`password`**: `String` (Required, min 6 chars, excluded from default queries using `select: false`).
*   **`role`**: `String` (Required, enum `['Customer', 'Admin']`, default `Customer`).
*   *Indexes*: Unique index on `email`, standard index on `role`.
*   *Security Hooks*: Presave Hook automatically hashes raw passwords using `bcryptjs` (salt factor `12`) before committing to the DB.

### 📦 Order Collection Schema
*   **`trackingId`**: `String` (Required, unique, indexed).
*   **`customer`**: `ObjectId` (Ref to User, required, indexed).
*   **`pickupAddress`**: `String` (Required, trimmed).
*   **`deliveryAddress`**: `String` (Required, trimmed).
*   **`packageType`**: `String` (Required, enum `['Standard', 'Fragile', 'Express', 'Hazardous']`).
*   **`weight`**: `Number` (Required, min `0.1` kg).
*   **`status`**: `String` (Enum `['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']`, default `PENDING`).
*   **`estimatedDeliveryDate`**: `Date` (Required).
*   **`price`**: `Number` (Required, min `0.0`).
*   **`coordinates`**: Cartesian Coordinate Map objects:
    *   `pickup`: `{ x: Number, y: Number }`
    *   `delivery`: `{ x: Number, y: Number }`
    *   `current`: `{ x: Number, y: Number }`
*   **`history`**: Audit array tracking status changes (`status`, `timestamp`, `note`).
*   *Indexes*: Unique index on `trackingId`, compound index on `{ customer: 1, status: 1 }` for high-performance dashboard listings.

---

## 3. Real-Time Tracking Canvas Map & GPS Simulator

### 📡 Satellite Radar Map (Frontend)
The shipment detail views feature a custom HTML5 Canvas-drawn map. It generates:
*   A green/cyan glowing Cartesian radar grid mesh.
*   Glowing waypoint nodes for the **Pickup Hub** and **Delivery Station**.
*   A rotating sweeps radar beam using sub-pixel rendering.
*   An animated courier airplane moving smoothly along the vector path.
*   Auto-polling hooks: Synchronizes and updates shipment progress smoothly by fetching coordinates from the REST API every 4 seconds.

### 🚗 Server-Side GPS Simulation Engine
Embedded directly into `backend/server.js` is a background worker thread (running on a 8s tick rate):
1.  It queries all database shipments marked as `SHIPPED`.
2.  It calculates the Euclidean vector line joining the pickup coordinate to the destination coordinate.
3.  It increments the progress of the `current` coordinate by 15% of the total distance per tick.
4.  Once progress hits 100%, the engine updates the database status to `DELIVERED`, attaches a finalized delivery timestamp log, and parks the airplane marker at the destination terminal.

---

## 4. API Documentation

All platform endpoints return a standardized envelope structure:
*   **Success Envelope**: `{ success: true, message?: "...", data?: { ... } }`
*   **Error Envelope**: `{ success: false, message: "Error message detail" }`

### 🔑 Authentication Gateways (`/api/auth`)
#### 1. Register Account
*   `POST /register`
*   *Payload*: `{ "name": "Marcus Vance", "email": "marcus@logitrack.com", "password": "securepass123", "role": "Customer" }`
*   *Response*: Returns user profile object and signed JWT token (`201 Created`).

#### 2. User Login
*   `POST /login`
*   *Payload*: `{ "email": "marcus@logitrack.com", "password": "securepass123" }`
*   *Response*: Authenticates credentials against hashes and returns JWT and user roles (`200 OK`).

#### 3. Current User Context
*   `GET /me` (Protected)
*   *Response*: Decodes current Bearer JWT and returns full profile details (`200 OK`).

### 📦 Order Manifest Gateways (`/api/orders`)
#### 1. File Delivery Manifest
*   `POST /` (Protected, Customer-only)
*   *Payload*: `{ "pickupAddress": "New York Station", "deliveryAddress": "Boston Center", "packageType": "Fragile", "weight": 5.4 }`
*   *Calculation*: Computes price dynamically ($12 base + weight surcharge + category premium) and allocates random Cartesian map coordinates.
*   *Response*: Returns the registered shipment details (`201 Created`).

#### 2. Retrieve My Orders Queue
*   `GET /` (Protected, Customer-only)
*   *Query Parameters*: `page` (default 1), `limit` (default 8), `status` (filter), `search` (filter trackingId or addresses).
*   *Response*: Returns paginated orders matching the customer profile (`200 OK`).

#### 3. Dispatch Control Tower Queue
*   `GET /all` (Protected, Admin-only)
*   *Query Parameters*: `page`, `limit`, `status`, `search`.
*   *Response*: Returns paginated platform orders, client info, and system wide operational counts for dashboard statistics cards (`200 OK`).

#### 4. Shipment Coordinates Detail
*   `GET /:id` (Protected, Customer owner or Admin-only)
*   *URL Params*: ID can be Mongoose ID or unique Tracking ID (e.g. `TRK-20260518-A8F2`).
*   *Response*: Returns comprehensive shipment coordinate fields and timeline logs (`200 OK`).

#### 5. Cancel Shipment Manifest
*   `DELETE /:id` (Protected, Customer owner-only)
*   *Validation Constraints*: Shipments can **only be cancelled/deleted if status is PENDING**.
*   *Response*: Purges database record and confirms deletion (`200 OK`).

#### 6. Advance Shipment Status Vector
*   `PATCH /:id/status` (Protected, Admin-only)
*   *Payload*: `{ "status": "SHIPPED" }` (Allowed: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`).
*   *Response*: Updates status, logs entry in auditing timeline, and starts simulation trackers (`200 OK`).

---

## 5. Local Setup & Deployment Guide

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (Either installed locally, run via Docker, or an Atlas cluster URL)

### Step 1: Start MongoDB
If you have **Docker** installed, launch MongoDB instantly with a single command from the project root:
```bash
docker-compose up -d
```
Alternatively, ensure a local MongoDB server is running on `mongodb://localhost:27017`.

### Step 2: Install Dependencies
The root project features an orchestrator script that automatically installs dependencies for both `backend/` and `frontend/` directories:
```bash
npm run install-all
```

### Step 3: Run the Platform (Development)
Launch the backend REST API server and the Vite React client concurrently with a single command:
```bash
npm run dev
```
*   **Vite Frontend client**: Running on [http://localhost:5173](http://localhost:5173)
*   **Express REST Server**: Running on [http://localhost:5000](http://localhost:5000)

---

## 6. Production Deployment Strategy

1.  **Frontend Compilation**:
    Compile the optimized client bundle:
    ```bash
    npm run build --prefix frontend
    ```
    This outputs standard static HTML/CSS/JS assets to `frontend/dist`, which can be served efficiently via Nginx, Vercel, or AWS S3.
2.  **Environment Configuration**:
    In production, replace default variables inside `backend/.env` with your secure credentials:
    *   Set `NODE_ENV=production` for minimized Express stack traces.
    *   Bind a secure, high-entropy `JWT_SECRET`.
    *   Point `MONGODB_URI` to a redundant MongoDB Atlas cluster.
3.  **Process Management**:
    Run the Express backend using PM2 to ensure auto-restarts and load balancing across multi-core processors:
    ```bash
    npm install -g pm2
    pm2 start backend/server.js --name "logitrack-api"
    ```
