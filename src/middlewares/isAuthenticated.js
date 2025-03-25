const isAuthenticated = (req, res, next) => {
  // Log entire session for debugging
  console.log("Full authentication check session:", req.session);

  // Detailed logging of session properties
  console.log("Session exists:", !!req.session);
  console.log("User in session:", req.session && req.session.user);

  // Comprehensive check
  if (!req.session || !req.session.user) {
    console.log("Authentication failed: No session or user");
    return res.status(401).send({
      message: "Not authenticated",
      details: {
        sessionExists: !!req.session,
        userInSession: req.session && !!req.session.user,
      },
    });
  }

  // Check user role
  if (req.session.user.role === "user") {
    console.log("Authentication successful");
    return next();
  }

  console.log("Authentication failed: Incorrect role");
  res.status(401).send({ message: "You must be logged in to access this" });
};
