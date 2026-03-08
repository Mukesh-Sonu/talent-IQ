import express from "express";
import { ENV } from "./lib/env.js";

const app = express();
const { PORT } = ENV;
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
