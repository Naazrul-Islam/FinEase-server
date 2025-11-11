require("dotenv").config(); 
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FinEase Server is Running ✅");
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("FinEaseDB");
    const transactions = db.collection("transactions");

    //  Get all transactions with optional sorting
    app.get("/my-transactions", async (req, res) => {
      try {
        const { sortBy = "date", order = "desc", userEmail } = req.query;

        // Build sort object
        let sort = {};
        if (sortBy === "date") {
          sort.date = order === "asc" ? 1 : -1;
        } else if (sortBy === "amount") {
          sort.amount = order === "asc" ? 1 : -1;
        }

        // Query by userEmail if provided
        const query = userEmail ? { userEmail } : {};

        const allTransactions = await transactions.find(query).sort(sort).toArray();
        res.json(allTransactions);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    //  Get overview summary (total income, expenses, balance)
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

    //  Post (Add new transaction)
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

    //  Delete transaction
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

    //  Get single transaction (for View Details)
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

    //  Update transaction
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

    //  Reports route
    app.get("/reports/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const { month } = req.query; 

        const query = { userEmail: email };
        if (month) {
          query.date = { $regex: `^${month}` };
        }

        const allTransactions = await transactions.find(query).toArray();

        const categorySummary = {};
        allTransactions.forEach((t) => {
          const cat = t.category || "Uncategorized";
          categorySummary[cat] = (categorySummary[cat] || 0) + Number(t.amount || 0);
        });

        const monthlySummary = {};
        allTransactions.forEach((t) => {
          const monthKey = t.date.slice(0, 7);
          monthlySummary[monthKey] = (monthlySummary[monthKey] || 0) + Number(t.amount || 0);
        });

        const totalIncome = allTransactions
          .filter((t) => t.type === "Income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpenses = allTransactions
          .filter((t) => t.type === "Expense")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalBalance = totalIncome - totalExpenses;

        res.json({
          totalIncome,
          totalExpenses,
          totalBalance,
          categorySummary,
          monthlySummary,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully!");
  } finally {
    // nothing
  }
}

run().catch(console.dir);

// 🚀 Server listening
app.listen(port, () => {
  console.log(`🚀 FinEase Server running on port ${port}`);
});
