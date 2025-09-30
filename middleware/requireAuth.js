const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// Verifies either our app JWT (issued in routes/auth.js) or a Firebase ID token
module.exports = async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const firebaseToken = req.headers['x-firebase-token'];

    // 1) Try our own JWT first
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: payload.userId || payload.id, email: payload.email, source: 'jwt' };
        return next();
      } catch (_) {
        // fall through to Firebase verification
      }
    }

    // 2) Try Firebase ID token (from header or body for backward-compat)
    const candidateFirebaseToken = firebaseToken || (req.body && req.body.firebaseToken) || null;
    if (candidateFirebaseToken) {
      // If running in demo mode, skip Firebase verification
      if (process.env.FIREBASE_PROJECT_ID === 'demo-project') {
        return res.status(401).json({ error: 'Firebase not configured' });
      }
      try {
        const decoded = await admin.auth().verifyIdToken(candidateFirebaseToken);
        req.user = { uid: decoded.uid, email: decoded.email, source: 'firebase' };
        return next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid Firebase token' });
      }
    }

    return res.status(401).json({ error: 'Unauthorized' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

