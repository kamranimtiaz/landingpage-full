import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env, Variables } from './types';
import { handleSubmit } from './routes/submit';
import { handleAlpineBits } from './routes/alpinebits';
import { alpineBitsAuth, adminAuth } from './middleware/auth';

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

// AlpineBits endpoint (protected with ASA credentials)
// POST /alpinebits
app.post('/alpinebits', alpineBitsAuth, handleAlpineBits);

// Admin endpoints (protected with admin credentials)
// GET /admin/requests - List all guest requests (for future dashboard)
app.get('/admin/requests', adminAuth, async (c) => {
  try {
    const hotelCode = c.req.query('hotel_code');
    const status = c.req.query('status');

    let query = 'SELECT * FROM guest_requests';
    const params: string[] = [];
    const conditions: string[] = [];

    if (hotelCode) {
      conditions.push('hotel_code = ?');
      params.push(hotelCode);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const stmt = c.env.DB.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

    return c.json({
      success: true,
      count: result.results?.length || 0,
      requests: result.results || []
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return c.json({
      success: false,
      error: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch requests'
    }, 500);
  }
});

// GET /admin/hotels - List all hotels
app.get('/admin/hotels', adminAuth, async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM hotels ORDER BY hotel_name').all();

    return c.json({
      success: true,
      count: result.results?.length || 0,
      hotels: result.results || []
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return c.json({
      success: false,
      error: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch hotels'
    }, 500);
  }
});

// GET /admin/stats - Get statistics
app.get('/admin/stats', adminAuth, async (c) => {
  try {
    const [totalRequests, pendingRequests, sentRequests, acknowledgedRequests] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM guest_requests').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM guest_requests WHERE status = ?').bind('pending').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM guest_requests WHERE status = ?').bind('sent').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM guest_requests WHERE status = ?').bind('acknowledged').first()
    ]);

    return c.json({
      success: true,
      stats: {
        total: (totalRequests as any)?.count || 0,
        pending: (pendingRequests as any)?.count || 0,
        sent: (sentRequests as any)?.count || 0,
        acknowledged: (acknowledgedRequests as any)?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({
      success: false,
      error: 'DATABASE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch statistics'
    }, 500);
  }
});

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
