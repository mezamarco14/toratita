const mongoose = require('mongoose');

// 1. Producción (Updated)
const ProductionSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    panGrandeQty: Number,
    panPequenoQty: Number,
    notes: String
});

// 2. Vendedoras (New)
const SellerSchema = new mongoose.Schema({
    name: String,
    phone: String, // Para WhatsApp
    joinedAt: { type: Date, default: Date.now }
});

// 3. Distribución (New)
const DistributionSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    panGrandeSent: Number,
    panPequenoSent: Number,
    totalValue: Number // Calculado al momento de enviar
});

// 4. Pagos/Cobros (New)
const PaymentSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    amount: Number,
    panGrandeSold: Number, // Opcional, para control detallado
    panPequenoSold: Number, // Opcional
    notes: String
});

// 5. Gastos (Existing + Updated)
const ExpenseSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    itemName: String,
    category: String, // 'Insumos', 'Pérdida', 'Mantenimiento'
    amount: Number,
    notes: String
});

// 6. Pérdidas Específicas (New)
const LossSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: String, // 'Pan Malogrado', 'Masa', 'Insumo'
    quantity: Number,
    estimatedValue: Number,
    notes: String
});

const Production = mongoose.model('Production', ProductionSchema);
const Seller = mongoose.model('Seller', SellerSchema);
const Distribution = mongoose.model('Distribution', DistributionSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const Loss = mongoose.model('Loss', LossSchema);

// 7. Usuarios (Auth)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true } // In production, hash this!
});
const User = mongoose.model('User', UserSchema);

module.exports = { Production, Seller, Distribution, Payment, Expense, Loss, User };
