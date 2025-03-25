const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role == "admin") {
    console.log(req.session.user.role);
    return next();
  }
  return res.status(401).send({ message: "Unauthorized Access" });
};

module.exports = isAdmin;
