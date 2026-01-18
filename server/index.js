const express = require('express'); 
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { Production, Seller, Distribution, Payment, Expense, Loss } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- ROUTES ---

// 0. AUTH & SETUP
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await require('./models').User.findOne({ username, password });
    if (user) {
      res.json({ success: true, name: user.username });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create default admin if not exists (One-time setup)
const setupAdmin = async () => {
  const { User } = require('./models');
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    await new User({ username: 'admin', password: '123' }).save(); // Default password
    console.log('👑 Admin user created: admin / 123');
  }
};
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bakery')
  .then(() => {
    console.log('✅ MongoDB Connected (Toratita V2)');
    setupAdmin(); // Run setup
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server V2 running on port ${PORT}`);
    });
  }).catch(err => console.error(err));

// 1. PRODUCTION
app.post('/api/production', async (req, res) => {
  try {
    const { panGrandeQty, panPequenoQty, notes } = req.body;
    const newProd = new Production({ panGrandeQty, panPequenoQty, notes });
    await newProd.save();
    res.status(201).json(newProd);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/production', async (req, res) => {
  const data = await Production.find().sort({ date: -1 }).limit(30);
  res.json(data);
});

// 2. SELLERS (VENDEDORAS)
app.post('/api/sellers', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const newSeller = new Seller({ name, phone });
    await newSeller.save();
    res.status(201).json(newSeller);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/sellers', async (req, res) => {
  const sellers = await Seller.find();
  res.json(sellers);
});

// 3. DISTRIBUTION (ENVIOS) - Trigger logic for WhatsApp is frontend only, but we save record here
app.post('/api/distribution', async (req, res) => {
  try {
    const { sellerId, panGrandeSent, panPequenoSent, totalValue } = req.body;
    const newDist = new Distribution({ sellerId, panGrandeSent, panPequenoSent, totalValue });
    await newDist.save();
    res.status(201).json(newDist);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/distribution', async (req, res) => {
  const data = await Distribution.find().populate('sellerId').sort({ date: -1 }).limit(50);
  res.json(data);
});

// 4. PAYMENTS (COBROS)
app.post('/api/payments', async (req, res) => {
  try {
    const { sellerId, amount, notes } = req.body;
    const newPayment = new Payment({ sellerId, amount, notes });
    await newPayment.save();
    res.status(201).json(newPayment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/payments', async (req, res) => {
  const data = await Payment.find().populate('sellerId').sort({ date: -1 }).limit(50);
  res.json(data);
});

// 5. EXPENSES & LOSSES
app.post('/api/expenses', async (req, res) => {
  try {
    const { itemName, category, amount, notes } = req.body;
    const newExp = new Expense({ itemName, category, amount, notes });
    await newExp.save();
    res.status(201).json(newExp);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/expenses', async (req, res) => {
  const data = await Expense.find().sort({ date: -1 }).limit(50);
  res.json(data);
});

app.post('/api/losses', async (req, res) => {
  try {
    const { type, quantity, estimatedValue, notes } = req.body;
    const newLoss = new Loss({ type, quantity, estimatedValue, notes });
    await newLoss.save();
    res.status(201).json(newLoss);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/losses', async (req, res) => {
  const data = await Loss.find().sort({ date: -1 }).limit(50);
  res.json(data);
});

// --- STATS (REPORTES) ---
app.get('/api/reports/weekly', async (req, res) => {
  // Basic aggregation for now
  // In a real app, we'd use robust date filtering
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const income = await Payment.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const losses = await Loss.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$estimatedValue" } } }
    ]);

    res.json({
      weekIncome: income[0]?.total || 0,
      weekExpenses: expenses[0]?.total || 0,
      weekLosses: losses[0]?.total || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// End of Routes
