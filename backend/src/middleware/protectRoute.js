import { requireAuth } from "@clerk/express";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    const clerkId = req.auth().userId;

    if (!clerkId)
      return res.status(401).json({ msg: "Unauthorized - Invalid token" });

    const user = await User.findOne({ clerkId });

    if (!user) return res.status(404).json({ msg: "User not found" });

    req.user = user;

    next();

    try {
    } catch (error) {
      console.log("Error in protectRoute middleware", error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  },
];
