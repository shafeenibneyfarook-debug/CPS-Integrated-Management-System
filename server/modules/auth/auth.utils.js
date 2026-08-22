const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24;

const encode = (value) => Buffer.from(value).toString("base64url");

exports.hashPassword = (password) => new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, key) => {
        if (error) return reject(error);
        resolve(`${salt}:${key.toString("hex")}`);
    });
});

exports.verifyPassword = (password, storedHash) => new Promise((resolve, reject) => {
    const [salt, savedKey] = (storedHash || "").split(":");
    if (!salt || !savedKey) return resolve(false);
    crypto.scrypt(password, salt, 64, (error, key) => {
        if (error) return reject(error);
        const savedBuffer = Buffer.from(savedKey, "hex");
        resolve(savedBuffer.length === key.length && crypto.timingSafeEqual(savedBuffer, key));
    });
});

exports.createToken = (user) => {
    const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = encode(JSON.stringify({
        sub: user._id.toString(), role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS
    }));
    const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
    return `${header}.${payload}.${signature}`;
};

exports.verifyToken = (token) => {
    const [header, payload, signature] = (token || "").split(".");
    if (!header || !payload || !signature) throw new Error("Invalid token");
    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) throw new Error("Invalid token");
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp <= Math.floor(Date.now() / 1000)) throw new Error("Expired token");
    return data;
};
