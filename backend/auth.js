const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("./db");

const JWT_ALGO = "HS256";
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

function hashPassword(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: JWT_ALGO, expiresIn: "8h" }
  );
}

function cookieOptions() {
  const frontendUrl = process.env.FRONTEND_URL || "";
  const isHttps = frontendUrl.startsWith("https://");
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  };
}

function readToken(req) {
  if (req.cookies?.access_token) return req.cookies.access_token;
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

async function currentUser(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ detail: "Authentication required" });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [JWT_ALGO] });
  } catch (_e) {
    return res.status(401).json({ detail: "Invalid or expired session" });
  }
  const user = await User.findOne({ id: payload.sub }, { _id: 0, password_hash: 0 }).lean();
  if (!user) return res.status(401).json({ detail: "User not found" });
  req.user = user;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ detail: "Authentication required" });
    if (req.user.role !== role) {
      const label = role === "super_admin" ? "Admin" : "Associate";
      return res.status(403).json({ detail: `${label} access required` });
    }
    next();
  };
}

module.exports = { hashPassword, verifyPassword, issueToken, cookieOptions, currentUser, requireRole };
