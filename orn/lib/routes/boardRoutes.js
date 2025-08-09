"use strict";
/**
 * Board Management Routes
 * CRUD API for SUP board inventory and availability management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get all boards with optional location filter
router.get('/', async (req, res) => {
    try {
        const { location, status } = req.query;
        let ref = firebase_1.db.collection('boards');
        if (location) {
            ref = ref.where('location', '==', location);
        }
        if (status) {
            ref = ref.where('status', '==', status);
        }
        const snapshot = await ref.orderBy('name').get();
        const boards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: boards });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Get board availability for booking
router.get('/availability', async (req, res) => {
    try {
        const { location, date, timeSlot } = req.query;
        let ref = firebase_1.db.collection('boards');
        if (location) {
            ref = ref.where('location', '==', location);
        }
        const snapshot = await ref.get();
        let boards = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || `Board #${doc.id.slice(-3)}`,
            status: doc.data().status || 'available',
            location: doc.data().location || 'Pier A',
            ...doc.data()
        }));
        // If no boards exist, create sample boards
        if (boards.length === 0) {
            console.log('No boards found, creating sample boards...');
            boards = await createSampleBoards();
        }
        res.json({
            success: true,
            data: { boards }
        });
    }
    catch (error) {
        console.error('Error getting board availability:', error);
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Create sample boards for development
async function createSampleBoards() {
    const sampleBoards = [
        { id: 'board-1', name: 'Board #1', status: 'available', location: 'Pier A' },
        { id: 'board-2', name: 'Board #2', status: 'available', location: 'Pier A' },
        { id: 'board-3', name: 'Board #3', status: 'occupied', location: 'Pier A' },
        { id: 'board-4', name: 'Board #4', status: 'available', location: 'Pier A' },
        { id: 'board-5', name: 'Board #5', status: 'reserved', location: 'Pier B' },
        { id: 'board-6', name: 'Board #6', status: 'available', location: 'Pier B' },
        { id: 'board-7', name: 'Board #7', status: 'available', location: 'Pier B' },
        { id: 'board-8', name: 'Board #8', status: 'available', location: 'Pier B' },
    ];
    try {
        const batch = firebase_1.db.batch();
        sampleBoards.forEach(board => {
            const boardRef = firebase_1.db.collection('boards').doc(board.id);
            batch.set(boardRef, {
                ...board,
                maintenanceStatus: 'good',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });
        await batch.commit();
        console.log('Sample boards created successfully');
        return sampleBoards;
    }
    catch (error) {
        console.error('Error creating sample boards:', error);
        return sampleBoards;
    }
}
// Create new board (admin only)
router.post('/', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { name, location, qrCode } = req.body;
        if (!name || !location) {
            res.status(400).json({ success: false, error: 'Name and location are required' });
            return;
        }
        const boardData = {
            name,
            location,
            status: 'available',
            maintenanceStatus: 'good',
            qrCode: qrCode || null,
            reservedBy: null,
            reservedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const docRef = await firebase_1.db.collection('boards').add(boardData);
        res.json({ success: true, id: docRef.id, message: 'Board created successfully' });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Update board (admin only)
router.put('/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, error: 'Board ID is required' });
            return;
        }
        const updates = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        await firebase_1.db.collection('boards').doc(id).update(updates);
        res.json({ success: true, message: 'Board updated successfully' });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Update board status (for reservations)
router.put('/:id/status', authMiddleware_1.protect, async (req, res) => {
    try {
        const { role } = req.user;
        const { id } = req.params;
        const { status, reservedBy } = req.body;
        if (!id) {
            res.status(400).json({ success: false, error: 'Board ID is required' });
            return;
        }
        if (!status) {
            res.status(400).json({ success: false, error: 'Status is required' });
            return;
        }
        const updateData = {
            status,
            updatedAt: new Date().toISOString()
        };
        if (status === 'reserved' && reservedBy) {
            updateData.reservedBy = reservedBy;
            updateData.reservedAt = new Date().toISOString();
        }
        else if (status === 'available') {
            updateData.reservedBy = null;
            updateData.reservedAt = null;
        }
        await firebase_1.db.collection('boards').doc(id).update(updateData);
        res.json({ success: true, message: 'Board status updated successfully' });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Delete board (admin only)
router.delete('/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, error: 'Board ID is required' });
            return;
        }
        // Check if board is currently reserved
        const boardDoc = await firebase_1.db.collection('boards').doc(id).get();
        if (boardDoc.exists) {
            const boardData = boardDoc.data();
            if (boardData?.status === 'reserved' || boardData?.reservedBy) {
                res.status(400).json({
                    success: false,
                    error: 'Cannot delete reserved board'
                });
                return;
            }
        }
        await firebase_1.db.collection('boards').doc(id).delete();
        res.json({ success: true, message: 'Board deleted successfully' });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Bulk update board statuses (admin only)
router.post('/bulk-update', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const { boardIds, updates } = req.body;
        if (!boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
            res.status(400).json({ success: false, error: 'Board IDs array is required' });
            return;
        }
        const batch = firebase_1.db.batch();
        const updateData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };
        boardIds.forEach((boardId) => {
            const boardRef = firebase_1.db.collection('boards').doc(boardId);
            batch.update(boardRef, updateData);
        });
        await batch.commit();
        res.json({
            success: true,
            message: `${boardIds.length} boards updated successfully`
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
// Initialize default boards (admin only)
router.post('/initialize', authMiddleware_1.protect, authMiddleware_1.adminOnly, async (req, res) => {
    try {
        const defaultBoards = [
            { name: 'Board #1', location: 'Pier A' },
            { name: 'Board #2', location: 'Pier A' },
            { name: 'Board #3', location: 'Pier A' },
            { name: 'Board #4', location: 'Pier A' },
            { name: 'Board #5', location: 'Pier B' },
            { name: 'Board #6', location: 'Pier B' },
            { name: 'Board #7', location: 'Pier B' },
            { name: 'Board #8', location: 'Pier B' },
        ];
        const batch = firebase_1.db.batch();
        defaultBoards.forEach(board => {
            const boardRef = firebase_1.db.collection('boards').doc();
            batch.set(boardRef, {
                ...board,
                status: 'available',
                maintenanceStatus: 'good',
                qrCode: null,
                reservedBy: null,
                reservedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        });
        await batch.commit();
        res.json({
            success: true,
            message: `${defaultBoards.length} default boards created successfully`
        });
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errMsg });
    }
});
exports.default = router;
//# sourceMappingURL=boardRoutes.js.map