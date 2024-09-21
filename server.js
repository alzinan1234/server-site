// index.js
require('dotenv').config(); // Load environment variables

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// MongoDB Connection URI and Database Name from environment variables
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

let carts; // Collection reference

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectDB() {
  try {
    await client.connect();
    const database = client.db(dbName);
    carts = database.collection("carts");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1); // Exit process with failure
  }
}

// Immediately invoke the connectDB function
connectDB();

// --------- Routes ---------

// GET - Home Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// POST - Create a Cart Item
app.post("/carts", async (req, res) => {
  try {
    const newItem = req.body;

    // Basic validation
    if (!newItem.product || !newItem.quantity) {
      return res.status(400).json({
        message: "Product and quantity are required fields.",
      });
    }

    const result = await carts.insertOne(newItem);

    res.status(201).json({
      message: "Cart item created successfully",
      data: result.ops[0], // Return the inserted document
    });
  } catch (error) {
    console.error("Error creating cart item:", error);
    res.status(500).json({
      message: "Failed to create cart item.",
    });
  }
});

// GET - Retrieve All Cart Items
app.get("/carts", async (req, res) => {
  try {
    const allItems = await carts.find({}).toArray();
    res.status(200).json(allItems);
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    res.status(500).json({
      message: "Failed to retrieve cart items.",
    });
  }
});

// GET - Retrieve a Single Cart Item by ID
app.get("/carts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item ID." });
    }

    const item = await carts.findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error retrieving cart item:", error);
    res.status(500).json({
      message: "Failed to retrieve cart item.",
    });
  }
});

// PUT - Update a Cart Item by ID
app.put("/carts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item ID." });
    }

    // Basic validation
    if (!updatedData.product && !updatedData.quantity) {
      return res.status(400).json({
        message: "At least one of product or quantity must be provided for update.",
      });
    }

    const result = await carts.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnOriginal: false }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    res.status(200).json({
      message: "Cart item updated successfully",
      data: result.value,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({
      message: "Failed to update cart item.",
    });
  }
});

// DELETE - Remove a Cart Item by ID
app.delete("/carts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid cart item ID." });
    }

    const result = await carts.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    res.status(200).json({ message: "Cart item deleted successfully." });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    res.status(500).json({
      message: "Failed to delete cart item.",
    });
  }
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Global Error Handler (Optional)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "An unexpected error occurred." });
});

// Start server
app.listen(port, () => {
  console.log(`Your Server is running on port ${port}`);
});
