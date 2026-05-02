const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const { signToken } = require("../services/auth");
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../services/productService");
const { createNotification } = require("../realtime/socketServer");

async function createAuthResponse(user, message) {
  const token = signToken(user);
  return {
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

function requireGraphQLUser(context) {
  if (!context.user) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  return context.user;
}

function requireGraphQLRole(context, roles) {
  const user = requireGraphQLUser(context);
  if (!roles.includes(user.role)) {
    const error = new Error("Forbidden: insufficient role");
    error.status = 403;
    throw error;
  }
  return user;
}

const resolvers = {
  User: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Product: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Notification: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Message: {
    id: (parent) => parent.id || parent._id?.toString(),
  },
  Query: {
    me: async (_, __, context) => context.user,
    products: async (_, args) => listProducts(args),
    product: async (_, { id }) => getProductById(id),
    notifications: async (_, { limit = 20 }, context) => {
      const user = requireGraphQLUser(context);
      return Notification.find({ user: user._id })
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(limit, 1), 50))
        .lean();
    },
    conversations: async (_, { withUserId }, context) => {
      const user = requireGraphQLUser(context);
      if (!mongoose.Types.ObjectId.isValid(withUserId)) {
        const error = new Error("Invalid user id");
        error.status = 400;
        throw error;
      }

      return Message.find({
        $or: [
          { sender: user._id, recipient: withUserId },
          { sender: withUserId, recipient: user._id },
        ],
      })
        .populate("sender", "name email role")
        .populate("recipient", "name email role")
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();
    },
  },
  Mutation: {
    signup: async (_, { name, email, password }, context) => {
      const existing = await User.findOne({
        email: String(email).toLowerCase(),
      });
      if (existing) {
        const error = new Error("Email already registered");
        error.status = 409;
        throw error;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email: String(email).toLowerCase(),
        password: passwordHash,
        role: "user",
      });

      const payload = await createAuthResponse(user, "Signup successful");
      if (context.res) {
        const { setTokenCookie } = require("../services/auth");
        setTokenCookie(context.res, payload.token);
      }
      return payload;
    },
    login: async (_, { email, password }, context) => {
      const user = await User.findOne({
        email: String(email).toLowerCase(),
      }).select("+password");
      if (!user) {
        const error = new Error("Invalid credentials");
        error.status = 401;
        throw error;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        const error = new Error("Invalid credentials");
        error.status = 401;
        throw error;
      }

      const payload = await createAuthResponse(user, "Login successful");
      if (context.res) {
        const { setTokenCookie } = require("../services/auth");
        setTokenCookie(context.res, payload.token);
      }
      return payload;
    },
    createProduct: async (_, args, context) => {
      const user = requireGraphQLUser(context);
      const product = await createProduct({ userId: user._id, payload: args });

      const notification = await createNotification({
        userId: user._id,
        type: "product",
        title: "Product created",
        body: `${product.name} was created successfully`,
        link: "/products",
      });

      if (context.io) {
        context.io
          .to(`user:${user._id.toString()}`)
          .emit("notification:new", notification);
      }

      return product;
    },
    updateProduct: async (_, { id, ...payload }, context) => {
      const user = requireGraphQLUser(context);
      return updateProduct({ id, payload, user });
    },
    deleteProduct: async (_, { id }, context) => {
      const user = requireGraphQLUser(context);
      if (user.role !== "admin") {
        const error = new Error("Forbidden: admin role required");
        error.status = 403;
        throw error;
      }
      return deleteProduct({ id, user });
    },
    markNotificationRead: async (_, { id }, context) => {
      const user = requireGraphQLUser(context);
      const notification = await Notification.findOneAndUpdate(
        { _id: id, user: user._id },
        { readAt: new Date() },
        { new: true },
      ).populate("user", "name email role");

      if (!notification) {
        const error = new Error("Notification not found");
        error.status = 404;
        throw error;
      }

      return notification;
    },
    sendMessage: async (_, { recipientId, body }, context) => {
      const user = requireGraphQLUser(context);
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        const error = new Error("Invalid recipient id");
        error.status = 400;
        throw error;
      }

      const recipient = await User.findById(recipientId).select("-password");
      if (!recipient) {
        const error = new Error("Recipient not found");
        error.status = 404;
        throw error;
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

      if (context.io) {
        context.io
          .to(`user:${recipient._id.toString()}`)
          .emit("chat:message", populatedMessage);
        context.io
          .to(`user:${recipient._id.toString()}`)
          .emit("notification:new", notification);
        context.io
          .to(`user:${user._id.toString()}`)
          .emit("chat:message", populatedMessage);
      }

      return { ok: true, message: "Message sent successfully" };
    },
  },
};

module.exports = resolvers;
