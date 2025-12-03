// quick-test.js (in server folder)
import connectDB from "../config/db.js";

(async () => {
  try {
    const pool = await connectDB();
    const r = await pool.request().query("SELECT 1 AS val");
    console.log("OK:", r.recordset);
    process.exit(0);
  } catch (e) {
    console.error("CONNECT TEST ERROR:", e.message || e);
    process.exit(1);
  }
})();
