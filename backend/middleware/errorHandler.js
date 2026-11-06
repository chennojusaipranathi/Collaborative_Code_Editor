// Unknown URL: runs when no route matched
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Catches any error thrown in a route and sends a clean JSON response
export function errorHandler(err, _req, res, _next) {
  // Malformed JSON body, e.g. a missing quote
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }

  // Duplicate key from MongoDB (two people registering the same email at once)
  if (err.code === 11000) {
    return res.status(409).json({ message: "That value is already in use" });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
}