const { z } = require('zod');

const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error:   'Validation failed',
      details: result.error.issues.map((i) => ({
        field:   i.path.join('.'),
        message: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate, registerSchema, loginSchema };
