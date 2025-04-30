// Vercel serverless function entry point
import app from '../server-vercel.js';

export default function handler(req, res) {
  // Log request for debugging
  console.log(`[Vercel] ${req.method} ${req.url}`);
  
  // Forward the request to the Express app
  return app(req, res);
}