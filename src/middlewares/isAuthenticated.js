const isAuthenticated = (req, res, next) => {
  // Log the entire session to understand its structure
  console.log("Full session:", req.session.user);

  // Check if session exists
  if (!req.session) {
    return res.status(401).send({ message: "No session found" });
  }

  // Check if user exists in the session
  if (!req.session.user) {
    return res.status(401).send({ message: "User not logged in" });
  }

  // Check user role with more detailed logging
  console.log("Session user:", req.session.user);
  console.log("User role:", req.session.user.role);

  if (req.session.user.role === "user") {
    return next(); // pass control to the next middleware
  }

  // If no conditions are met
  res.status(401).send({ message: "You must be logged in to access this" });
};

module.exports = isAuthenticated;
