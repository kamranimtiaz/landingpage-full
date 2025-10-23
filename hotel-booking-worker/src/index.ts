import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env, Variables } from './types';
import { handleSubmit } from './routes/submit';
import { handleAlpineBits } from './routes/alpinebits';
import { alpineBitsAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());

// CORS configuration - allow Webflow domains
app.use('/submit/*', cors({
  origin: '*', // Configure with specific Webflow domains in production
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'Hotel Booking Worker',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Health check for monitoring
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// Form submission endpoint
// POST /submit/{hotel-code}
// Note: URL parameter is still called :hotelId for backward compatibility
app.post('/submit/:hotelId', handleSubmit);

// AlpineBits endpoint (protected with HTTP Basic Authentication)
// POST /alpinebits
app.post('/alpinebits', alpineBitsAuth, handleAlpineBits);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred'
  }, 500);
});

export default app;
