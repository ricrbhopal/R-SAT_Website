import express from "express";
import {
  listCallers,

} from "../controller/callerController.js";

const router = express.Router();



// List referrals (for caller or admin/manager)
router.get("/", listCallers);



export default router;
