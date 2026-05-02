const mongoose = require("mongoose");
const Product = require("../models/Product");

function buildProductFilter({ search = "", category = "" } = {}) {
  const filter = {};

  if (search) {
    filter.$text = { $search: search };
  }

  if (category) {
    filter.category = new RegExp(`^${category}$`, "i");
  }

  return filter;
}

async function listProducts({
  page = 1,
  limit = 10,
  search = "",
  category = "",
} = {}) {
  const safePage = Math.max(Number.parseInt(page, 10), 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10), 1), 50);
  const skip = (safePage - 1) * safeLimit;
  const filter = buildProductFilter({ search, category });

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("createdBy", "name email role")
      .sort(
        search
          ? { score: { $meta: "textScore" }, createdAt: -1 }
          : { createdAt: -1 },
      )
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    },
  };
}

async function getProductById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid product id");
    error.status = 400;
    throw error;
  }

  const product = await Product.findById(id)
    .populate("createdBy", "name email role")
    .lean();

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  return product;
}

async function createProduct({ userId, payload }) {
  const product = await Product.create({
    ...payload,
    createdBy: userId,
  });

  return Product.findById(product._id)
    .populate("createdBy", "name email role")
    .lean();
}

async function updateProduct({ id, payload, user }) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid product id");
    error.status = 400;
    throw error;
  }

  const existing = await Product.findById(id);
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  const isOwner = existing.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    const error = new Error("Only owner or admin can update this product");
    error.status = 403;
    throw error;
  }

  Object.assign(existing, payload);
  await existing.save();

  return Product.findById(existing._id)
    .populate("createdBy", "name email role")
    .lean();
}

async function deleteProduct({ id, user }) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid product id");
    error.status = 400;
    throw error;
  }

  const existing = await Product.findById(id);
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  const isOwner = existing.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    const error = new Error("Only owner or admin can delete this product");
    error.status = 403;
    throw error;
  }

  await Product.findByIdAndDelete(id);
  return { message: "Product deleted successfully" };
}

module.exports = {
  buildProductFilter,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
