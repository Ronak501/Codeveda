const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", auth, async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit || "10", 10), 1),
      50,
    );
    const skip = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (category) {
      filter.category = new RegExp(`^${category}$`, "i");
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate("createdBy", "name email role")
        .sort(
          search
            ? { score: { $meta: "textScore" }, createdAt: -1 }
            : { createdAt: -1 },
        )
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id)
      .populate("createdBy", "name email role")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    return next(error);
  }
});

router.post("/", auth, async (req, res, next) => {
  try {
    const { name, description, category, price, stock } = req.body;

    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock,
      createdBy: req.user._id,
    });

    const populated = await Product.findById(product._id)
      .populate("createdBy", "name email role")
      .lean();

    return res.status(201).json(populated);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", auth, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isOwner = existing.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Only owner or admin can update this product" });
    }

    const { name, description, category, price, stock } = req.body;
    existing.name = name;
    existing.description = description;
    existing.category = category;
    existing.price = price;
    existing.stock = stock;

    await existing.save();

    const updated = await Product.findById(existing._id)
      .populate("createdBy", "name email role")
      .lean();

    return res.status(200).json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", auth, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
