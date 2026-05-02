const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

async function resolveUserFromSocket(socket) {
  const cookieHeader = socket.handshake.headers.cookie || "";
  const cookies = cookie.parse(cookieHeader);
  const token = cookies.token || socket.handshake.auth?.token || null;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-password");
    return user || null;
  } catch {
    return null;
  }
}

async function createNotification({ userId, type, title, body, link = "" }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    body,
    link,
  });

  return notification.populate("user", "name email role");
}

function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const user = await resolveUserFromSocket(socket);
      socket.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    if (!user) {
      socket.emit("socket:error", { message: "Authentication required" });
      socket.disconnect(true);
      return;
    }

    const userRoom = `user:${user._id.toString()}`;
    socket.join(userRoom);
    socket.emit("socket:ready", {
      user: { id: user._id, name: user.name, role: user.role },
    });

    socket.on("chat:send", async (payload, callback = () => {}) => {
      try {
        const recipientId = String(payload?.recipientId || "").trim();
        const body = String(payload?.body || "").trim();

        if (!recipientId || !body) {
          callback({ ok: false, message: "recipientId and body are required" });
          return;
        }

        if (recipientId === user._id.toString()) {
          callback({ ok: false, message: "Cannot send message to yourself" });
          return;
        }

        const recipient = await User.findById(recipientId).select("-password");
        if (!recipient) {
          callback({ ok: false, message: "Recipient not found" });
          return;
        }

        const message = await Message.create({
          sender: user._id,
          recipient: recipient._id,
          body,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "name email role")
          .populate("recipient", "name email role")
          .lean();

        const notification = await createNotification({
          userId: recipient._id,
          type: "message",
          title: `New message from ${user.name}`,
          body,
          link: "/messages",
        });

        io.to(`user:${recipient._id.toString()}`).emit(
          "chat:message",
          populatedMessage,
        );
        io.to(`user:${recipient._id.toString()}`).emit(
          "notification:new",
          notification,
        );
        io.to(userRoom).emit("chat:message", populatedMessage);

        callback({ ok: true, message: populatedMessage });
      } catch (error) {
        callback({ ok: false, message: "Unable to send message" });
      }
    });

    socket.on("notifications:fetch", async (callback = () => {}) => {
      try {
        const notifications = await Notification.find({ user: user._id })
          .populate("user", "name email role")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
        callback({ ok: true, notifications });
      } catch {
        callback({ ok: false, message: "Unable to fetch notifications" });
      }
    });

    socket.on("disconnect", () => {});
  });
}

module.exports = {
  registerSocketHandlers,
  createNotification,
};
