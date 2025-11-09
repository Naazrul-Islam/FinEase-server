const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// 🔗 MongoDB connection URI
const uri =
  "mongodb+srv://FinEase:j1YX3lA1qat0Z42P@cluster0.c0vwcej.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// 🧩 Middleware
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("FinEase Server is Running ✅");
});

async function run() {
  try {
    await client.connect();
    const db = client.db("FinEaseDB");
    const transactions = db.collection("transactions");

    // ✅ Get all transactions
    app.get("/my-transactions", async (req, res) => {
      try {
        const allTransactions = await transactions.find({}).toArray();
        res.json(allTransactions);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ✅ Get overview summary (total income, expenses, balance)
    app.get("/overview", async (req, res) => {
      try {
        const allTransactions = await transactions.find({}).toArray();

        const totalIncome = allTransactions
          .filter((t) => t.type === "Income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpenses = allTransactions
          .filter((t) => t.type === "Expense")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalBalance = totalIncome - totalExpenses;

        res.json({ totalIncome, totalExpenses, totalBalance });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ✅ Post (Add new transaction)
    app.post("/add-transactions", async (req, res) => {
      try {
        const { amount, type, category, date, description, userEmail } = req.body;

        if (!amount || !type || !category || !date || !userEmail) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        await transactions.insertOne({
          amount: Number(amount),
          type,
          category,
          date,
          description,
          userEmail,
        });

        res.json({ message: "Transaction added successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ✅ Delete transaction
    app.delete("/transactions/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await transactions.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.json({ message: "Transaction deleted successfully" });
        } else {
          res.status(404).json({ message: "Transaction not found" });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });
    

    // ✅ Get single transaction (for View Details)
    app.get("/transactions/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const transaction = await transactions.findOne({ _id: new ObjectId(id) });

        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        res.json(transaction);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ✅ Update transaction
    app.put("/transactions/update/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await transactions.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 1) {
          res.json({ message: "Transaction updated successfully" });
        } else {
          res.status(404).json({ message: "Transaction not found" });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ✅ Ping test
    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully!");
  } finally {
    // keep the connection open
  }
}

run().catch(console.dir);

// 🚀 Server listening
app.listen(port, () => {
  console.log(`🚀 FinEase Server running on port ${port}`);
});
