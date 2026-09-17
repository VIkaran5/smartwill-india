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
    .transform(val => String(val || '').replace(/\D/g, ''))
    // Bug #5 Fix: Also enforce Indian mobile leading digit rule [6-9].
    // The frontend validator (isValidIndianPhone) does this, but without
    // it here Cashfree rejects the order with a cryptic error.
    .refine(val => /^[6-9]\d{9}$/.test(val), { message: 'Phone number must be a valid 10-digit Indian mobile number starting with 6-9' }),
  email: z.string().email('Invalid email address').optional()
});

function validateCreateOrderPayload(data) {
  return createOrderSchema.safeParse(data);
}

module.exports = {
  createOrderSchema,
  validateCreateOrderPayload
};
