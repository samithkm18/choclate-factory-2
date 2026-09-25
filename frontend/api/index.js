export default function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'Mani Kote Factory Vercel Serverless Function Test from frontend/api',
    timestamp: new Date().toISOString()
  });
}
