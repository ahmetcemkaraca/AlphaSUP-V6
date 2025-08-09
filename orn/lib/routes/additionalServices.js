"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const additionalServices = [
    { id: 'photography', name: 'Fotoğraf Çekimi', price: 100, unit: 'session' },
    { id: 'transport', name: 'Transfer Hizmeti', price: 75, unit: 'round_trip' },
    { id: 'lunch-package', name: 'Öğle Yemeği Paketi', price: 50, unit: 'person' },
];
router.get('/', async (_req, res) => {
    try {
        res.status(200).json({ success: true, data: additionalServices });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch additional services' });
    }
});
exports.default = router;
//# sourceMappingURL=additionalServices.js.map