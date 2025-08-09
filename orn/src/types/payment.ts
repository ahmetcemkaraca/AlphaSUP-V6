export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethodType {
  CARD = 'card',
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

export type PaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled';

export type PaymentIntent = {
  id: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  clientSecret: string;
  paymentMethods: string[];
  captureMethod: 'automatic' | 'manual';
  metadata?: Record<string, any>;
  expiresAt?: string;
};

export type PaymentRefund = {
  id: string;
  paymentId: string;
  refundId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  providerRefundId?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CardInfo = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  country?: string;
};

export type Payment = {
  id: string;
  paymentId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: { type: PaymentMethodType; card?: CardInfo };
  status: PaymentStatus;
  intentStatus: PaymentIntentStatus;
  provider: 'stripe';
  providerTransactionId?: string;
  providerMetadata?: Record<string, any>;
  fees: { processingFee: number; platformFee: number; totalFees: number };
  authorizedAt?: string;
  capturedAt?: string;
  refunds: PaymentRefund[];
  refundableAmount: number;
  receiptSent: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
