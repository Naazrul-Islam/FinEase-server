const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://FinEase:j1YX3lA1qat0Z42P@cluster0.c0vwcej.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
// j1YX3lA1qat0Z42P
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
     const db = client.db("FinEaseDB");
    const transactions = db.collection("transactions");
    
    app.get('/api/overview', async (req, res) => {
  try {
    const db = client.db("FinEaseDB");
    const transactions = db.collection("transactions");

    const allTransactions = await transactions.find({}).toArray();

    const totalIncome = allTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    res.json({ totalIncome, totalExpenses, totalBalance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
