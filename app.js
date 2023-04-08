import connectDB from "./db/db.js";
import express from "express";
import bodyParser from "body-parser";

import session from "express-session";
import { default as connectMongoDBSession } from "connect-mongodb-session";

const MongoDBStore = connectMongoDBSession(session);

import dotenv from "dotenv";
dotenv.config();
import path from "path";
const Guide = require("./models/guide.cjs");
const Tourist = require("./models/tourist.cjs");

const dbUrl = "mongodb://0.0.0.0:27017/tripper";

connectDB();
const PORT = 5005;

const app = express();
//guide session
const oSessionStore = new MongoDBstore({
  //calling constructor
  uri: dbUrl,
  collection: "usersessions",
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "mugiwara",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use("/profile", express.static("upload/images"));

//session setup for guide
app.use(
  session({
    secret: "Guide and Tourist is awsome",
    resave: false,
    saveUninitialized: false,
    store: oSessionStore,
  })
);

//guide store
app.use((req, res, next) => {
  if (!req.session.guide) {
    return next();
  }
  Guide.findById(req.session.guide._id)
    .then((guide) => {
      req.guide = guide;
      req.isGuideAuth = true;
      next();
    })
    .catch((err) => console.log(err));
});
//local variable
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

//tourist session
app.use((req, res, next) => {
  if (!req.session.tourist) {
    return next();
  }
  Tourist.findById(req.session.tourist._id)
    .then((tourist) => {
      req.tourist = tourist;
      req.isTouristAuth = true;
      next();
    })
    .catch((err) => console.log(err));
});
//local variable for tourist
app.use((req, res, next) => {
  res.locals.isTouristAuthenticated = req.session.isTouristLoggedIn;
  next();
});

//admin login
app.use((req, res, next) => {
  if (!req.session.admin) {
    return next();
  }
  req.admin = {
    adminname: process.env.ADMIN_ID,
    adminpass: process.env.ADMIN_PASS,
  };
  next();
});
app.use((req, res, next) => {
  res.locals.isAdminAuthenticated = req.session.isAdminLoggedIn;
  next();
});

app.get("/", (req, res) => {
  res.render("Screen/landing", {
    pageTitle: "Tripper",
  });
});

app.get("/package_details", (req, res) => {
  res.render("package_details", {
    pageTitle: "Tripper",
  });
});
app.get("/package", (req, res) => {
  res.render("allpackage", {
    pageTitle: "Tripper",
  });
});
app.get("/blogdetails", (req, res) => {
  res.render("singleBlog", {
    pageTitle: "Tripper",
  });
});

app.get("/allblog", (req, res) => {
  res.render("blog", {
    pageTitle: "Tripper",
  });
});

app.get("/navigation", (req, res) => {
  res.render("includes/navigation", {
    pageTitle: "Tripper",
  });
});

app.get("/adminlogin", (req, res) => {
  res.render("admin/adminlogin");
});

app.get("/guidelogin", (req, res) => {
  res.render("Guide/guidelogin");
});

app.get("/touristlogin", (req, res) => {
  res.render("Tourist/touristlogin");
});

app.get("/signup", (req, res) => {
  res.render("signup/signup");
});
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/package");
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
