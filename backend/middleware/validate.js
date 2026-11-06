// Returns a middleware that checks req.body against a Zod schema.
// On success, req.body is replaced with the cleaned data.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues[0].message;
      return res.status(400).json({ message });
    }

    req.body = result.data;
    next();
  };
}