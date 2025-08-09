"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminController_1 = require("../controllers/adminController");
// Mock Firebase admin
jest.mock('../config/firebase', () => ({
    db: {
        collection: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({
                size: 5,
                docs: [],
                forEach: jest.fn()
            })),
            where: jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({
                    size: 2,
                    docs: [],
                    forEach: jest.fn()
                })),
                where: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        size: 1,
                        docs: [],
                        forEach: jest.fn()
                    }))
                }))
            })),
            orderBy: jest.fn(() => ({
                limit: jest.fn(() => ({
                    get: jest.fn(() => Promise.resolve({
                        docs: []
                    }))
                }))
            }))
        }))
    }
}));
describe('AdminController.getDashboardStats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should return stats JSON', async () => {
        const req = {
            user: {
                uid: 'testUser',
                role: 'admin',
                email: 'test@admin.com'
            }
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { json, status };
        const next = jest.fn();
        await (0, adminController_1.getDashboardStats)(req, res, next);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                overview: expect.any(Object),
                recentActivity: expect.any(Array),
                popularServices: expect.any(Array)
            })
        }));
    });
    it('should handle errors correctly', async () => {
        const mockError = new Error('Database connection failed');
        // Mock the error by importing the mock
        const { db } = require('../config/firebase');
        db.collection.mockImplementationOnce(() => {
            throw mockError;
        });
        const req = {
            user: {
                uid: 'testUser',
                role: 'admin',
                email: 'test@admin.com'
            }
        };
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res = { json, status };
        const next = jest.fn();
        await (0, adminController_1.getDashboardStats)(req, res, next);
        expect(next).toHaveBeenCalledWith(mockError);
    });
});
//# sourceMappingURL=adminController.test.js.map