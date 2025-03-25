const express = require("express");
const connectDB = require("./database");
const cors = require("cors");
const morgan = require("morgan");
const rescuesRouter = require("./routes/rescuesRoutes");
const authRouter = require("./routes/authRoutes");
const applicationsRouter = require("./routes/applicationsRoutes");
const userRouter = require("./routes/userRoutes");
const inquiriesRouter = require("./routes/inquiriesRoutes");
const adminAuthRouter = require("./routes/adminAuthRoutes");
const adminRouter = require("./routes/adminRoutes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo");
const CustomError = require("./errors/CustomError");

const app = express();

//Connect to the database
connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS properly for cookies
app.use(
  cors({
    origin: "https://heartofpawstarlac.netlify.app",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false, //avoids saving unchanged sessions
    saveUninitialized: true, //save new sessions
    store: mongoStore.create({
      mongoUrl: process.env.ATLAS_URI,
      maxAge: 1000 * 60 * 60 * 24,
    }),
    cookie: {
      secure: true,
      httpOnly: true, // Prevents JavaScript from accessing cookies (security measure)
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 1-day expiration
    }, //config cookie
  }) //stores the session in MongoDb instead of default server memory
);

app.use(morgan("tiny"));
app.set("trust proxy", 1);

app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/rescues", rescuesRouter);
app.use("/adminAuth", adminAuthRouter);
app.use("/auth", authRouter);
app.use("/applications", applicationsRouter);
app.use("/inquiries", inquiriesRouter);

//error handler middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Something went wrong, please try again later.",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}...`);
});
