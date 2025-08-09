"use strict";
/**
 * Service Terms Routes
 * CRUD API for service terms and conditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all service terms (optionally filtered by serviceType)
router.get('/', async (req, res) => {
    try {
        const { serviceType } = req.query;
        let ref = firebase_1.db.collection('serviceTerms');
        let snapshot;
        if (serviceType) {
            snapshot = await ref.where('serviceType', '==', serviceType).get();
        }
        else {
            snapshot = await ref.get();
        }
        let terms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // If no terms exist, return sample terms
        if (terms.length === 0) {
            console.log('No service terms found, returning sample terms...');
            terms = getSampleTerms(serviceType);
        }
        res.json({ success: true, data: terms });
    }
    catch (error) {
        console.error('Error getting service terms:', error);
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Get sample terms for development
function getSampleTerms(serviceType) {
    const allTerms = [
        {
            id: 'term-1',
            title: 'Güvenlik Kuralları',
            content: 'SUP aktivitesi sırasında güvenlik kurallarına uyulması zorunludur. Can yeleği kullanımı mecburidir.',
            isRequired: true,
            serviceType: 'rental',
            order: 1
        },
        {
            id: 'term-2',
            title: 'Hasar Sorumluluğu',
            content: 'Ekipman hasarlarından müşteri sorumludur. Hasar durumunda ek ücret talep edilebilir.',
            isRequired: true,
            serviceType: 'rental',
            order: 2
        },
        {
            id: 'term-3',
            title: 'İptal Koşulları',
            content: '24 saat önceden yapılan iptallerde tam iade, daha geç iptallerde %50 iade yapılır.',
            isRequired: false,
            serviceType: 'rental',
            order: 3
        },
        {
            id: 'term-4',
            title: 'Yaş Sınırlaması',
            content: '12 yaş altındaki katılımcılar için veli izni ve velinin refakati zorunludur.',
            isRequired: true,
            serviceType: 'tour',
            order: 4
        },
        {
            id: 'term-5',
            title: 'Hava Durumu Koşulları',
            content: 'Olumsuz hava koşullarında aktivite iptal edilebilir. Bu durumda tam iade yapılır.',
            isRequired: false,
            serviceType: 'tour',
            order: 5
        }
    ];
    if (serviceType) {
        return allTerms.filter(term => term.serviceType === serviceType);
    }
    return allTerms;
}
// Create new service terms (admin only)
router.post('/', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { title, content, serviceType, isRequired, order } = req.body;
        if (!title || !content || !serviceType) {
            res.status(400).json({ success: false, error: 'Missing required fields' });
            return;
        }
        const newTerm = {
            title,
            content,
            serviceType,
            isRequired: !!isRequired,
            order: order || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const docRef = await firebase_1.db.collection('serviceTerms').add(newTerm);
        res.json({ success: true, id: docRef.id });
        return;
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
        return;
    }
});
// Update service terms (admin only)
router.put('/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ success: false, error: 'Missing id parameter' });
            return;
        }
        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        await firebase_1.db.collection('serviceTerms').doc(id).update(updates);
        res.json({ success: true });
        return;
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
        return;
    }
});
// Delete service terms (admin only)
router.delete('/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            res.status(400).json({ success: false, error: 'Missing id parameter' });
            return;
        }
        await firebase_1.db.collection('serviceTerms').doc(id).delete();
        res.json({ success: true });
        return;
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
        return;
    }
});
exports.default = router;
//# sourceMappingURL=serviceTermsRoutes.js.map