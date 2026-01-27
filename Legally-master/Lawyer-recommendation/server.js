require("dotenv").config();
const express = require("express");
const lawyerRoutes = require("./routes/lawyers");

const app = express();

app.use("/api", lawyerRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
