import { Context, Next } from 'hono';
import { Env } from '../types';

/**
 * AlpineBits Basic Authentication Middleware
 * Validates HTTP Basic Access Authentication as per AlpineBits specification
 * Also validates required AlpineBits headers
 */
export async function alpineBitsAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  console.log('===  AUTH MIDDLEWARE ===');
  console.log('URL:', c.req.url);
  console.log('Method:', c.req.method);

  const authHeader = c.req.header('Authorization');
  const clientProtocolVersion = c.req.header('X-AlpineBits-ClientProtocolVersion');
  const clientId = c.req.header('X-AlpineBits-ClientID');

  console.log('X-AlpineBits-ClientProtocolVersion:', clientProtocolVersion);
  console.log('X-AlpineBits-ClientID:', clientId);
  console.log('Authorization header present:', !!authHeader);

  // Check for required X-AlpineBits-ClientProtocolVersion header
  if (!clientProtocolVersion) {
    console.error('❌ Missing X-AlpineBits-ClientProtocolVersion header');
    return new Response('ERROR:missing X-AlpineBits-ClientProtocolVersion header', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Check if credentials are configured
  const expectedUsername = c.env.ALPINEBITS_USERNAME;
  const expectedPassword = c.env.ALPINEBITS_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    console.error('ALPINEBITS_USERNAME or ALPINEBITS_PASSWORD is not configured');
    return new Response('ERROR:authentication not configured', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Validate Authorization header format
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('ERROR:invalid or missing username/password', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
        'WWW-Authenticate': 'Basic realm="AlpineBits"'
      }
    });
  }

  // Extract and decode base64 credentials
  const base64Credentials = authHeader.substring(6); // Remove 'Basic ' prefix
  let credentials: string;

  try {
    credentials = atob(base64Credentials);
  } catch (error) {
    console.warn('Invalid base64 encoding in Authorization header');
    return new Response('ERROR:invalid or missing username/password', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
        'WWW-Authenticate': 'Basic realm="AlpineBits"'
      }
    });
  }

  // Split username and password
  const [username, password] = credentials.split(':');

  // Validate credentials
  if (username !== expectedUsername || password !== expectedPassword) {
    console.warn('Invalid credentials attempt');
    return new Response('ERROR:invalid or missing username/password', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
        'WWW-Authenticate': 'Basic realm="AlpineBits"'
      }
    });
  }

  // Optional: Check if ClientID is required
  const requireClientId = c.env.ALPINEBITS_REQUIRE_CLIENT_ID === 'true';
  if (requireClientId && !clientId) {
    return new Response('ERROR:no valid client id provided', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Store validated headers in context for use in handlers
  c.set('alpinebits', {
    clientProtocolVersion,
    clientId: clientId || undefined
  });

  // Authentication successful, proceed to next handler
  await next();
}

/**
 * API Key Authentication Middleware (for other endpoints if needed)
 * Validates the X-API-Key header against the configured API key
 */
export async function apiKeyAuth(c: Context<{ Bindings: Env }>, next: Next): Promise<Response | void> {
  const apiKey = c.req.header('X-API-Key');
  const expectedKey = c.env.API_KEY;

  // Check if API key is configured
  if (!expectedKey) {
    console.error('API_KEY is not configured');
    return c.json({
      success: false,
      error: 'AUTH_NOT_CONFIGURED',
      message: 'Authentication is not properly configured'
    }, 500);
  }

  // Check if API key is provided
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'MISSING_API_KEY',
      message: 'API key is required. Provide it in the X-API-Key header.'
    }, 401);
  }

  // Validate API key
  if (apiKey !== expectedKey) {
    console.warn('Invalid API key attempt');
    return c.json({
      success: false,
      error: 'INVALID_API_KEY',
      message: 'Invalid API key provided'
    }, 403);
  }

  // API key is valid, proceed to next handler
  await next();
}
