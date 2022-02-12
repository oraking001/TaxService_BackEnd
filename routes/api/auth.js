const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const gravatar = require("gravatar");
const User = require("../../models/User");
const config = require("config");
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const auth = require("../../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post(
  "/login",
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        //register
        try {
          user = new User({
            email,
            password,
          });

          const salt = await bcrypt.genSalt(10);

          user.password = await bcrypt.hash(password, salt);

          await user.save();
          console.log("__New User added." + Date("Y-m-d"));

          const payload = {
            user: {
              id: user.id,
            },
          };

          jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: "5 days" },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        } catch (err) {
          console.error(err.message);
          res.status(500).send("Server error");
        }
      }

      //login
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Password incorrect." }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      console.log("___ User login: " + user.email);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/reqconsult",
  check("name", "Name is required").notEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check("phone", "Phone is required").notEmpty(),
  check("comments", "Comments is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { startDate, endDate, name, email, phone, comments } = req.body;
      console.log(req.body);
      //transfer mail
      var nodemailer = require("nodemailer");

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "nguyenjame440@gmail.com",
          pass: "Danil1234567",
        },
      });

      var mailOptions = {
        from: "nguyenjame440@gmail.com",
        to: "nguyenlanhngoc1@gmail.com",
        subject: "Consultant Meeting Schedule",
        text:
          "name: " +
          name +
          "\r\nemail: " +
          email +
          "\r\nphone: " +
          phone +
          "\r\ncomments: " +
          comments +
          "\r\nStart Date: " +
          startDate +
          "\r\nEnd Date: " +
          endDate,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      //transfer mail end
      res.json({ msg: "success" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
