const { z } = require('zod');

const verifyPaymentSchema = z.object({
  // Bug #4 Fix: Use z.string() with explicit coerce fallback to give a clear,
  // actionable error instead of a generic Zod 'Expected string, received undefined'.
  orderId: z.string({
    required_error: 'order_id is required.',
    invalid_type_error: 'order_id must be a non-empty string.'
  }).min(5, 'order_id is too short — must be at least 5 characters.').max(100, 'Order ID too long')
});

function validateVerifyPaymentPayload(data) {
  const normalizedData = {
    orderId: data.order_id || data.orderId || data.orderID || undefined
  };
  return verifyPaymentSchema.safeParse(normalizedData);
}

module.exports = {
  verifyPaymentSchema,
  validateVerifyPaymentPayload
};
