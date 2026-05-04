const crypto = require('crypto');
const axios  = require('axios');
const Order  = require('../models/Order');
const { success, error } = require('../utils/response');

const CF_BASE = process.env.CASHFREE_ENV === 'PROD'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const cfHeaders = () => ({
  'x-api-version':   '2023-08-01',
  'x-client-id':     process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'Content-Type':    'application/json',
});

// POST /api/payment/create-session
exports.createPaymentSession = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('customer', 'name email phone');
    if (!order) return error(res, 'Order not found.', 404);
    if (String(order.customer._id) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);
    if (order.paymentStatus === 'paid')
      return error(res, 'Order already paid.', 400);

    const cfPayload = {
      order_id:       order.orderNumber,
      order_amount:   order.grandTotal,
      order_currency: 'INR',
      customer_details: {
        customer_id:    String(order.customer._id),
        customer_name:  order.customer.name  || 'Customer',
        customer_email: order.customer.email || `${order.customer._id}@placeholder.com`,
        customer_phone: order.customer.phone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/order/confirm?order_id=${order._id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payment/webhook`,
      },
    };

    const cfRes = await axios.post(`${CF_BASE}/orders`, cfPayload, { headers: cfHeaders() });

    order.cashfreeOrderId = cfRes.data.order_id;
    await order.save();

    success(res, {
      paymentSessionId: cfRes.data.payment_session_id,
      cashfreeOrderId:  cfRes.data.order_id,
      orderNumber:      order.orderNumber,
      grandTotal:       order.grandTotal,
    });
  } catch (err) {
    console.error('createPaymentSession:', err.response?.data || err.message);
    error(res, err.response?.data?.message || 'Payment session failed.', 500);
  }
};

// GET /api/payment/verify/:orderId
exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return error(res, 'Order not found.', 404);
    if (String(order.customer) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);

    const cfRes = await axios.get(
      `${CF_BASE}/orders/${order.cashfreeOrderId}/payments`,
      { headers: cfHeaders() }
    );

    const payments   = cfRes.data || [];
    const successful = payments.find((p) => p.payment_status === 'SUCCESS');

    if (successful && order.paymentStatus !== 'paid') {
      await markOrderPaid(order, successful.cf_payment_id);
    }

    success(res, { paid: order.paymentStatus === 'paid' || !!successful, order });
  } catch (err) {
    console.error('verifyPayment:', err.response?.data || err.message);
    error(res, 'Payment verification failed.', 500);
  }
};

// POST /api/payment/webhook  (Cashfree → Backend)
exports.webhook = async (req, res) => {
  try {
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];
    const rawBody   = req.rawBody || JSON.stringify(req.body);

    // Verify HMAC signature
    const computed = crypto
      .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET)
      .update(`${timestamp}${rawBody}`)
      .digest('base64');

    if (computed !== signature) {
      console.warn('⚠️  Webhook signature mismatch');
      return res.status(403).json({ ok: false });
    }

    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const cfOrderId = event.data?.order?.order_id;
      const cfPayId   = event.data?.payment?.cf_payment_id;
      const order     = await Order.findOne({ cashfreeOrderId: cfOrderId });

      if (!order) {
        console.error('Webhook: order not found for', cfOrderId);
        return res.status(200).json({ ok: true });
      }

      if (order.paymentStatus !== 'paid') {
        await markOrderPaid(order, cfPayId);
        console.log(`✅ Webhook paid: ${order.orderNumber}`);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(200).json({ ok: true }); // Always 200 to Cashfree
  }
};

// ─── Internal helper ──────────────────────────────────────────────────────────
async function markOrderPaid(order, cfPaymentId) {
  const Product = require('../models/Product');

  order.paymentStatus     = 'paid';
  order.cashfreePaymentId = cfPaymentId;
  order.paidAt            = new Date();
  order.status            = 'confirmed';
  order.subOrders.forEach((s) => { s.status = 'confirmed'; s.confirmedAt = new Date(); });

  if (!order.stockDeducted) {
    for (const sub of order.subOrders) {
      for (const item of sub.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;
        if (item.variationSku) {
          const v = product.variations.find((v) => v.sku === item.variationSku);
          if (v) v.stock = Math.max(0, v.stock - item.quantity);
        } else {
          product.baseStock = Math.max(0, product.baseStock - item.quantity);
        }
        await product.save();
      }
    }
    order.stockDeducted = true;
  }

  await order.save();
}
