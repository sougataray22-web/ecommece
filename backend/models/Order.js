const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  name:         String,
  image:        String,
  variationSku: String,
  attributes:   { type: Map, of: String },
  quantity:     { type: Number, required: true, min: 1 },
  unitPrice:    { type: Number, required: true },
  totalPrice:   { type: Number, required: true },
});

const VendorSubOrderSchema = new mongoose.Schema({
  vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:    [OrderItemSchema],
  subtotal: Number,
  status: {
    type: String,
    enum: ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'],
    default: 'pending',
  },
  trackingNumber:  String,
  trackingUrl:     String,
  shippingPartner: String,
  confirmedAt: Date,
  shippedAt:   Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  vendorNotes:  String,
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    shippingAddress: {
      label:   String,
      name:    String,
      phone:   String,
      line1:   String,
      line2:   String,
      city:    String,
      state:   String,
      pincode: String,
      country: { type: String, default: 'India' },
    },

    subOrders: [VendorSubOrderSchema],

    itemsTotal:    { type: Number, required: true },
    shippingTotal: { type: Number, default: 0 },
    taxTotal:      { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal:    { type: Number, required: true },

    couponCode:     String,
    couponDiscount: Number,

    paymentMethod: { type: String, enum: ['cashfree', 'cod'], default: 'cashfree' },
    paymentStatus: {
      type: String,
      enum: ['pending','paid','failed','refunded','partial_refund'],
      default: 'pending',
    },

    cashfreeOrderId:   String,
    cashfreePaymentId: String,
    paidAt:            Date,

    status: {
      type: String,
      enum: ['pending','confirmed','processing','partially_shipped','shipped','delivered','cancelled','refunded'],
      default: 'pending',
    },

    stockDeducted: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true }
);

OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ 'subOrders.vendor': 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ cashfreeOrderId: 1 });
OrderSchema.index({ paymentStatus: 1, status: 1 });

OrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `ORD-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
