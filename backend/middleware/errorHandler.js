// Catches any error thrown in a route and sends a clean JSON response
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}