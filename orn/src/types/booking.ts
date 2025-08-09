export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export type Booking = {
  id?: string;
  customerId?: string | null;
  serviceId: string;
  dateISO: string;
  time: string;
  people: number;
  boardType?: string;
  extras?: string[];
  totalTRY: number;
  status: BookingStatus;
  paymentStatus?: string;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
};
