import express from "express";
import { receiveCRMLead } from "../controllers/crmController.js";

const router = express.Router();

router.post("/lead", receiveCRMLead);

export default router;
