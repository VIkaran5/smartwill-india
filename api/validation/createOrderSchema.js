const { z } = require('zod');

/** Strips HTML/script tags from strings to prevent stored XSS */
const sanitizeString = (val) => val.replace(/[<>]/g, '');

const createOrderSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(sanitizeString)
    .optional()
    .default('SmartWill Customer'),
  phone: z.string()
    .transform(val => {
      const digits = String(val || '').replace(/\D/g, '');
      // If valid 10-digit Indian mobile starting with 6-9, retain it
      if (/^[6-9]\d{9}$/.test(digits)) return digits;
      // For international / NRI numbers, default to safe Cashfree customer phone
      return '9999999999';
    })
    .default('9999999999'),
  email: z.string().email('Invalid email address').optional(),
  plan: z.enum(['standard', 'nri']).optional().default('standard')
});

function validateCreateOrderPayload(data) {
  return createOrderSchema.safeParse(data);
}

module.exports = {
  createOrderSchema,
  validateCreateOrderPayload
};
