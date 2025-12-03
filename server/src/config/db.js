// src/config/db.js
import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const instanceName = process.env.DB_INSTANCE_NAME || null;
const port = process.env.DB_SERVER_PORT ? Number(process.env.DB_SERVER_PORT) : null;

const config = {
  user: process.env.DB_USER||'appuser',
  password: process.env.DB_PASS||'AppUser@12345',
  server: process.env.DB_SERVER_HOST || "localhost",
  database: process.env.DB_NAME||'RSAT_DB',
  options: { trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

if (instanceName) config.options.instanceName = instanceName;
else if (port) config.port = port;

let poolPromise = null;
export default async function connectDB() {
  try {
    if (!poolPromise) {
      poolPromise = sql.connect(config).then(pool => {
        console.log("✅ MSSQL Connected", {
          server: config.server,
          instance: instanceName || null,
          port: config.port || null,
          database: config.database
        });
        return pool;
      }).catch(err => { poolPromise = null; throw err; });
    }
    return await poolPromise;
  } catch (err) {
    console.error("❌ SQL Connection Error:", err.message || err);
    throw err;
  }
}
export { sql, config };
