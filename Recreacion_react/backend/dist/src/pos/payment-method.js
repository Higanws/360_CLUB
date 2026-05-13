"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POS_PAYMENT_METHODS = void 0;
exports.isPosPaymentMethod = isPosPaymentMethod;
exports.POS_PAYMENT_METHODS = [
    'efectivo',
    'tarjeta',
    'transferencia',
    'otro',
];
function isPosPaymentMethod(v) {
    return exports.POS_PAYMENT_METHODS.includes(v);
}
//# sourceMappingURL=payment-method.js.map