import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    // use clerkId for Stream (not mongodb _id) => it should match the id we have in the stream dashboard
    const token = chatClient.createToken(req.user.clerkId);

    res.status(200).json({
      token,
      userId: req.user.clerkId,
      username: req.user.name,
      userImage: req.user.image,
    });
  } catch (error) {
    console.log("Error in getStreamToken", error);
    res.status(500).json({ msg: "Internal Server error" });
  }
}
