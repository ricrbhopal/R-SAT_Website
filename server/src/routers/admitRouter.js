// routes/admitCardRoutes.js
import express from "express";
import {

  getAdmitCardById,

} from "../controller/admitCardController.js";

const router = express.Router();


router.get("/:id", getAdmitCardById);


export default router;
