require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const videoRoutes = require("../routes/videoRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/videos", videoRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
