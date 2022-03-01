const express = require("express");
const connectDB = require("./config/db");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const bodyParser = require("body-parser");

const app = express();
app.use(fileUpload());

const corsOption = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOption));

//Connect Database
connectDB();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Init Middleware
app.use(express.json());

//Define Routes
// Upload endpoint
app.post("/api/upload", (req, res) => {
  console.log("upload pass");
  if (req.files === null) {
    return res.status(400).json({ msg: "No file was uploaded" });
  }

  const file = req.files.file;

  file.mv(`${__dirname}/upload/${file.name}`, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    res.json({ fileName: file.name, filePath: `/uploads/${file.name}` });
  });
});
app.use("/api/auth", require("./routes/api/auth"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
