require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
    
const app = express();

const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : "*" }));
app.use(express.json());

// ---------- Modèle ----------
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    requestId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);
const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

// ---------- Health (sans base de données) ----------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", platform: "vercel", env: process.env.NODE_ENV || "development" });
});

// ---------- Connexion Mongoose (réutilisée en serverless) ----------
let connPromise = null;
function connectDB() {
  if (!connPromise) {
    connPromise = mongoose.connect(process.env.MONGODB_URI).catch(err => {
      connPromise = null;
      throw err;
    });
  }
  return connPromise;
}
app.use("/api/items", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    console.error("Erreur MongoDB :", e.message);
    res.status(500).json({ error: "Connexion à la base de données impossible" });
  }
});

// ---------- Routes ----------
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/items", async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const requestId = typeof req.body.requestId === "string" ? req.body.requestId : undefined;

  if (!name) return res.status(400).json({ error: "Le champ 'name' est requis" });

  try {
    const item = await Item.create({ name, description, requestId });
    res.status(201).json(item);
  } catch (e) {
    if (e.code === 11000 && requestId) {
      const existing = await Item.findOne({ requestId });
      return res.status(200).json(existing);
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});
connectDB().catch(err => {
  console.error("Erreur de connexion MongoDB :", err.message);
  process.exit(1);
});
app.use((req, res) => res.status(404).json({ error: "Route introuvable" }));

// ---------- Démarrage ----------
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));
}

module.exports = app;