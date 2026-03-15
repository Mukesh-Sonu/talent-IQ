import { Router } from "express";
import { getStreamToken } from "../controllers/chatController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.get("/token", protectRoute, getStreamToken);

export default Router;
