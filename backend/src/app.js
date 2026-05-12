require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const logger          = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// ─── Route imports (we'll add more in later phases) ───────────────────────────
const authRoutes       = require('./routes/auth.routes');
const categoryRoutes   = require('./routes/category.routes');
const productRoutes    = require('./routes/product.routes');
const supplierRoutes   = require('./routes/supplier.routes');
const warehouseRoutes  = require('./routes/warehouse.routes');
const stockRoutes      = require('./routes/stock.routes');
const poRoutes         = require('./routes/purchaseOrder.routes');
const orderRoutes      = require('./routes/customerOrder.routes');
const reportRoutes     = require('./routes/report.routes');
const employeeRoutes   = require('./routes/employee.routes');
const auditRoutes      = require('./routes/audit.routes');
const architectureRoutes = require('./routes/architecture.routes');
const inventoryRoutes  = require('./routes/inventory.routes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP request logging ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Health check (no auth required) ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IMS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,            authRoutes);
app.use(`${API}/categories`,      categoryRoutes);
app.use(`${API}/products`,        productRoutes);
app.use(`${API}/suppliers`,       supplierRoutes);
app.use(`${API}/warehouses`,      warehouseRoutes);
app.use(`${API}/stock`,           stockRoutes);
app.use(`${API}/purchase-orders`, poRoutes);
app.use(`${API}/orders`,          orderRoutes);
app.use(`${API}/reports`,         reportRoutes);
app.use(`${API}/employees`,       employeeRoutes);
app.use(`${API}/audit-logs`,      auditRoutes);
app.use(`${API}/architecture`,    architectureRoutes);
app.use(`${API}/inventory`,       inventoryRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
