const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory store for demo purposes
let users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  { id: 2, name: "Bob Smith", email: "bob@example.com" },
];
let nextId = 3;

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function validateUserPayload(payload, partial = false) {
  const errors = [];

  if (!partial || payload.name !== undefined) {
    if (typeof payload.name !== "string" || payload.name.trim().length < 2) {
      errors.push("name must be a string with at least 2 characters");
    }
  }

  if (!partial || payload.email !== undefined) {
    if (!isValidEmail(payload.email)) {
      errors.push("email must be a valid email address");
    }
  }

  return errors;
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// READ all
app.get("/api/users", (req, res) => {
  res.status(200).json(users);
});

// READ one
app.get("/api/users/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = users.find((u) => u.id === id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
});

// CREATE
app.post("/api/users", (req, res, next) => {
  try {
    const errors = validateUserPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === req.body.email.toLowerCase(),
    );
    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const newUser = {
      id: nextId++,
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
    };

    users.push(newUser);
    return res.status(201).json(newUser);
  } catch (error) {
    return next(error);
  }
});

// UPDATE
app.put("/api/users/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const errors = validateUserPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const emailExists = users.some(
      (u) =>
        u.id !== id && u.email.toLowerCase() === req.body.email.toLowerCase(),
    );
    if (emailExists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    users[index] = {
      id,
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
    };

    return res.status(200).json(users[index]);
  } catch (error) {
    return next(error);
  }
});

// DELETE
app.delete("/api/users/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const initialLength = users.length;
    users = users.filter((u) => u.id !== id);

    if (users.length === initialLength) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API 404 handler
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
