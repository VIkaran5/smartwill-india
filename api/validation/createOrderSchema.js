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
      let digits = String(val || '').replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
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
