import Session from "../models/Session.js";
import { chatClient, streamClient } from "../lib/stream.js";

export const createSession = async (req, res) => {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res
        .status(400)
        .json({ msg: "Problem and difficulty are required" });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}}`;

    // create session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.error("Error in session controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
export const getActiveSessions = async (_, res) => {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getActiveSessions controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

export const getMyRecentSessions = async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in getMyRecentSessions controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId");

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in getSessionById controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
export const joinSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user_id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ msg: "Session not found" });
    }

    if (session.participant) {
      return res.status(404).json({ msg: "Session is full" });
    }

    session.participant = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    res.status(200).json({ session });
  } catch (error) {
    console.error("Error in joinSession controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
export const endSession = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const session = await Session.findById(id);

    if (session) {
      return res.status(404).json({ msg: "Session is full" });
    }

    // check if the user is the host (only the host can end the session);

    if (session.host.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ msg: "Only then host can end the session" });
    }

    if (session.status === "completed") {
      return res.status(400).json({ msg: "Session is already completed" });
    }

    session.status = "completed";

    await session.save();
    return res.status(200).json({ msg: "Session ended successfully" });

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    await call.delete({ hard: true });

    // delete the chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete();
  } catch (error) {
    console.error("Error in endSession controller", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};
