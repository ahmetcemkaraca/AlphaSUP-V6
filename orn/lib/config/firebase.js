"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioFromNumber = exports.twilioAuthToken = exports.twilioSid = exports.stripeWebhookSecret = exports.stripeSecretKey = exports.config = exports.admin = exports.auth = exports.db = void 0;
const tslib_1 = require("tslib");
const admin = tslib_1.__importStar(require("firebase-admin"));
exports.admin = admin;
const functions = tslib_1.__importStar(require("firebase-functions"));
// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}
exports.db = admin.firestore();
exports.auth = admin.auth();
// Environment configuration
exports.config = functions.config();
// You might have other configurations like Stripe keys, Twilio credentials, etc.
// It is a good practice to access them via functions.config()
// Stripe configuration
exports.stripeSecretKey = exports.config['stripe']?.secret_key;
exports.stripeWebhookSecret = exports.config['stripe']?.webhook_secret;
// Twilio configuration
exports.twilioSid = exports.config['twilio']?.sid;
exports.twilioAuthToken = exports.config['twilio']?.token;
exports.twilioFromNumber = exports.config['twilio']?.from_number;
console.log('Firebase config initialized.');
//# sourceMappingURL=firebase.js.map