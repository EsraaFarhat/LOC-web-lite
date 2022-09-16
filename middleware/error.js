module.exports = function (err, req, res, next) {
  console.log(err);
  res.status(500).send({
    message: "Something failed at the server.",
    error: err.message,
  });
};
