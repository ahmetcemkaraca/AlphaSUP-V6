"use strict";
/**
 * Functions Type Definitions
 * Local copies of shared types for Firebase Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceType = exports.PaymentStatus = exports.BookingStatus = void 0;
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["TOUR"] = "tour";
    ServiceType["RENTAL"] = "rental";
    ServiceType["CLASS"] = "class";
    ServiceType["TRAINING"] = "training";
    ServiceType["PACKAGE"] = "package";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
//# sourceMappingURL=index.js.map