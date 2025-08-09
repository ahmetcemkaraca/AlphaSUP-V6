"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBusinessSettings = exports.getBusinessSettings = exports.updateBookingStatus = exports.getBookings = exports.deleteService = exports.updateService = exports.createService = exports.getServices = exports.getCustomer = exports.getCustomers = exports.importEquipment = exports.importBookings = exports.importServices = exports.exportEquipment = exports.exportBookings = exports.exportServices = exports.searchEquipment = exports.searchBookings = exports.searchServices = exports.getDashboardStats = exports.getDashboard = exports.getBusinessMetrics = exports.getServicePerformance = exports.getRevenueAnalytics = void 0;
/**
 * Get revenue analytics
 * Query: period=week|month|year
 */
const getRevenueAnalytics = async (req, res, next) => {
    try {
        const { period = 'week' } = req.query;
        const now = new Date();
        let startDate;
        if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        else {
            // week
            const day = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        }
        const bookingsSnapshot = await firebase_1.db.collection('bookings').where('createdAt', '>=', startDate).get();
        let revenue = 0;
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking['status'] === 'confirmed' || booking['status'] === 'completed') {
                revenue += booking['totalAmount'] || 0;
            }
        });
        res.json({ success: true, data: { period, revenue } });
    }
    catch (error) {
        console.error('Error getting revenue analytics:', error);
        next(error);
    }
};
exports.getRevenueAnalytics = getRevenueAnalytics;
/**
 * Get service performance analytics
 * Query: period=week|month|year
 */
const getServicePerformance = async (req, res, next) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate;
        if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        else if (period === 'week') {
            const day = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        }
        else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const bookingsSnapshot = await firebase_1.db.collection('bookings').where('createdAt', '>=', startDate).get();
        const serviceStats = {};
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking['serviceId']) {
                if (!serviceStats[booking['serviceId']]) {
                    serviceStats[booking['serviceId']] = { bookings: 0, revenue: 0 };
                }
                // Typescript safety
                const stats = serviceStats[booking['serviceId']];
                if (stats) {
                    stats.bookings++;
                    if (booking['status'] === 'confirmed' || booking['status'] === 'completed') {
                        stats.revenue += booking['totalAmount'] || 0;
                    }
                }
            }
        });
        res.json({ success: true, data: serviceStats });
    }
    catch (error) {
        console.error('Error getting service performance:', error);
        next(error);
    }
};
exports.getServicePerformance = getServicePerformance;
/**
 * Get business metrics
 */
const getBusinessMetrics = async (req, res, next) => {
    try {
        const customersSnapshot = await firebase_1.db.collection('customers').get();
        const bookingsSnapshot = await firebase_1.db.collection('bookings').get();
        const servicesSnapshot = await firebase_1.db.collection('services').get();
        const equipmentSnapshot = await firebase_1.db.collection('equipment').get();
        res.json({
            success: true,
            data: {
                totalCustomers: customersSnapshot.size,
                totalBookings: bookingsSnapshot.size,
                totalServices: servicesSnapshot.size,
                totalEquipment: equipmentSnapshot.size
            }
        });
    }
    catch (error) {
        console.error('Error getting business metrics:', error);
        next(error);
    }
};
exports.getBusinessMetrics = getBusinessMetrics;
/**
 * Get simplified dashboard overview for admin panel
 */
const getDashboard = async (req, res, next) => {
    try {
        // Fetch basic stats only
        const [customersSnapshot, bookingsSnapshot, servicesSnapshot] = await Promise.all([
            firebase_1.db.collection('customers').get(),
            firebase_1.db.collection('bookings').get(),
            firebase_1.db.collection('services').get()
        ]);
        const overview = {
            totalCustomers: customersSnapshot.size,
            totalBookings: bookingsSnapshot.size,
            totalServices: servicesSnapshot.size,
            updatedAt: new Date().toISOString()
        };
        res.json({ success: true, data: overview });
    }
    catch (error) {
        console.error('Error getting dashboard overview:', error);
        next(error);
    }
};
exports.getDashboard = getDashboard;
const firebase_1 = require("../config/firebase");
/**
 * Get dashboard statistics for admin panel
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Get all collections in parallel
        const [customersSnapshot, bookingsSnapshot, servicesSnapshot, todayBookingsSnapshot, monthBookingsSnapshot] = await Promise.all([
            firebase_1.db.collection('customers').get(),
            firebase_1.db.collection('bookings').get(),
            firebase_1.db.collection('services').get(),
            firebase_1.db.collection('bookings').where('createdAt', '>=', startOfToday).get(),
            firebase_1.db.collection('bookings').where('createdAt', '>=', startOfMonth).get()
        ]);
        // Calculate revenue
        let totalRevenue = 0;
        let monthlyRevenue = 0;
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking['status'] === 'confirmed' || booking['status'] === 'completed') {
                totalRevenue += booking['totalAmount'] || 0;
            }
        });
        monthBookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking['status'] === 'confirmed' || booking['status'] === 'completed') {
                monthlyRevenue += booking['totalAmount'] || 0;
            }
        });
        // Recent activity (last 10 bookings)
        const recentBookingsSnapshot = await firebase_1.db.collection('bookings')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        const recentActivity = [];
        for (const doc of recentBookingsSnapshot.docs) {
            const booking = doc.data();
            // Get customer info
            let customerName = 'Unknown Customer';
            if (booking['customerId']) {
                try {
                    const customerDoc = await firebase_1.db.collection('customers').doc(booking['customerId']).get();
                    if (customerDoc.exists) {
                        const customer = customerDoc.data();
                        customerName = `${customer?.['firstName']} ${customer?.['lastName']}`.trim() || customer?.['email'] || 'Unknown Customer';
                    }
                }
                catch (error) {
                    console.warn('Could not fetch customer for booking:', booking['customerId']);
                }
            }
            // Get service info
            let serviceName = 'Unknown Service';
            if (booking['serviceId']) {
                try {
                    const serviceDoc = await firebase_1.db.collection('services').doc(booking['serviceId']).get();
                    if (serviceDoc.exists) {
                        const service = serviceDoc.data();
                        serviceName = service?.['name'] || 'Unknown Service';
                    }
                }
                catch (error) {
                    console.warn('Could not fetch service for booking:', booking['serviceId']);
                }
            }
            recentActivity.push({
                id: doc.id,
                type: 'booking',
                description: `New booking by ${customerName} for ${serviceName}`,
                amount: booking['totalAmount'] || 0,
                status: booking['status'],
                timestamp: booking['createdAt']?.toDate?.() || booking['createdAt']
            });
        }
        // Popular services (most booked)
        const serviceBookings = {};
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            if (booking['serviceId']) {
                serviceBookings[booking['serviceId']] = (serviceBookings[booking['serviceId']] || 0) + 1;
            }
        });
        const popularServices = [];
        for (const [serviceId, bookingCount] of Object.entries(serviceBookings).slice(0, 5)) {
            try {
                const serviceDoc = await firebase_1.db.collection('services').doc(serviceId).get();
                if (serviceDoc.exists) {
                    const service = serviceDoc.data();
                    popularServices.push({
                        id: serviceId,
                        name: service?.['name'] || 'Unknown Service',
                        bookings: bookingCount,
                        revenue: bookingsSnapshot.docs
                            .filter(doc => doc.data()['serviceId'] === serviceId && (doc.data()['status'] === 'confirmed' || doc.data()['status'] === 'completed'))
                            .reduce((sum, doc) => sum + (doc.data()['totalAmount'] || 0), 0)
                    });
                }
            }
            catch (error) {
                console.warn('Could not fetch service details:', serviceId);
            }
        }
        // Sort popular services by booking count
        popularServices.sort((a, b) => b.bookings - a.bookings);
        const stats = {
            overview: {
                totalCustomers: customersSnapshot.size,
                totalBookings: bookingsSnapshot.size,
                totalServices: servicesSnapshot.size,
                totalRevenue: totalRevenue,
                monthlyRevenue: monthlyRevenue,
                todayBookings: todayBookingsSnapshot.size
            },
            recentActivity: recentActivity,
            popularServices: popularServices.slice(0, 5),
            updatedAt: new Date().toISOString()
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * Advanced filtering/search for services
 */
const searchServices = async (req, res, next) => {
    try {
        const { q = '' } = req.query;
        let query = firebase_1.db.collection('services');
        if (q) {
            query = query.where('name', '>=', q).where('name', '<=', q + '\uf8ff');
        }
        const snapshot = await query.get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Error searching services:', error);
        next(error);
    }
};
exports.searchServices = searchServices;
/**
 * Advanced filtering/search for bookings
 */
const searchBookings = async (req, res, next) => {
    try {
        const { status = '', customerId = '' } = req.query;
        let query = firebase_1.db.collection('bookings');
        if (status)
            query = query.where('status', '==', status);
        if (customerId)
            query = query.where('customerId', '==', customerId);
        const snapshot = await query.get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Error searching bookings:', error);
        next(error);
    }
};
exports.searchBookings = searchBookings;
/**
 * Advanced filtering/search for equipment
 */
const searchEquipment = async (req, res, next) => {
    try {
        const { location = '', status = '' } = req.query;
        let query = firebase_1.db.collection('equipment');
        if (location)
            query = query.where('location', '==', location);
        if (status)
            query = query.where('status', '==', status);
        const snapshot = await query.get();
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        console.error('Error searching equipment:', error);
        next(error);
    }
};
exports.searchEquipment = searchEquipment;
/**
 * Export services data (CSV/PDF)
 */
const exportServices = async (req, res, next) => {
    // TODO: Implement CSV/PDF export logic
    res.status(501).json({ success: false, error: 'Service export not implemented' });
};
exports.exportServices = exportServices;
/**
 * Export bookings data (CSV/PDF)
 */
const exportBookings = async (req, res, next) => {
    // TODO: Implement CSV/PDF export logic
    res.status(501).json({ success: false, error: 'Booking export not implemented' });
};
exports.exportBookings = exportBookings;
/**
 * Export equipment data (CSV/PDF)
 */
const exportEquipment = async (req, res, next) => {
    // TODO: Implement CSV/PDF export logic
    res.status(501).json({ success: false, error: 'Equipment export not implemented' });
};
exports.exportEquipment = exportEquipment;
/**
 * Import services data (CSV upload)
 */
const importServices = async (req, res, next) => {
    // TODO: Implement CSV import logic
    res.status(501).json({ success: false, error: 'Service import not implemented' });
};
exports.importServices = importServices;
/**
 * Import bookings data (CSV upload)
 */
const importBookings = async (req, res, next) => {
    // TODO: Implement CSV import logic
    res.status(501).json({ success: false, error: 'Booking import not implemented' });
};
exports.importBookings = importBookings;
/**
 * Import equipment data (CSV upload)
 */
const importEquipment = async (req, res, next) => {
    // TODO: Implement CSV import logic
    res.status(501).json({ success: false, error: 'Equipment import not implemented' });
};
exports.importEquipment = importEquipment;
/**
 * Get all customers with pagination and search
 */
const getCustomers = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc', lastDocId = '' } = req.query;
        let query = firebase_1.db.collection('customers');
        // Add search filter
        if (search) {
            query = query.where('email', '>=', search).where('email', '<=', search + '\uf8ff');
        }
        // Add status filter
        if (status) {
            query = query.where('status', '==', status);
        }
        // Add sorting
        query = query.orderBy(sortBy, sortOrder);
        // Handle pagination
        if (lastDocId) {
            const lastDoc = await firebase_1.db.collection('customers').doc(lastDocId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        // Apply limit
        query = query.limit(Number(limit));
        const snapshot = await query.get();
        const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Get total count for pagination
        const totalSnapshot = await firebase_1.db.collection('customers').get();
        const totalCount = totalSnapshot.size;
        res.json({
            success: true,
            data: {
                customers,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCount / Number(limit)),
                    totalCount,
                    hasNextPage: snapshot.docs.length === Number(limit),
                    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1]?.id : null
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting customers:', error);
        next(error);
    }
};
exports.getCustomers = getCustomers;
/**
 * Get a specific customer by ID
 */
const getCustomer = async (req, res, next) => {
    try {
        const customerId = req.params['customerId'];
        if (!customerId) {
            return res.status(400).json({
                success: false,
                error: 'Customer ID is required'
            });
        }
        const customerDoc = await firebase_1.db.collection('customers').doc(customerId).get();
        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }
        // Get customer bookings
        const bookingsSnapshot = await firebase_1.db.collection('bookings')
            .where('customerId', '==', customerId)
            .orderBy('createdAt', 'desc')
            .get();
        const bookings = [];
        for (const bookingDoc of bookingsSnapshot.docs) {
            const booking = bookingDoc.data();
            // Get service details
            let serviceName = 'Unknown Service';
            if (booking['serviceId']) {
                try {
                    const serviceDoc = await firebase_1.db.collection('services').doc(booking['serviceId']).get();
                    if (serviceDoc.exists) {
                        serviceName = serviceDoc.data()?.['name'] || 'Unknown Service';
                    }
                }
                catch (error) {
                    console.warn('Could not fetch service for booking:', booking['serviceId']);
                }
            }
            bookings.push({
                id: bookingDoc.id,
                ...booking,
                serviceName
            });
        }
        const customer = {
            id: customerDoc.id,
            ...customerDoc.data(),
            bookings,
            stats: {
                totalBookings: bookings.length,
                totalSpent: bookings
                    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
                    .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
                lastBooking: bookings.length > 0 ? bookings[0].createdAt : null
            }
        };
        return res.json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        console.error('Error getting customer:', error);
        next(error);
    }
};
exports.getCustomer = getCustomer;
/**
 * Get all services with filtering
 */
const getServices = async (req, res, next) => {
    try {
        const { status = '', type = '', category = '', isActive = '' } = req.query;
        let query = firebase_1.db.collection('services');
        // Add filters
        if (status) {
            query = query.where('status', '==', status);
        }
        if (type) {
            query = query.where('type', '==', type);
        }
        if (category) {
            query = query.where('category', '==', category);
        }
        // Default ordering
        query = query.orderBy('updatedAt', 'desc');
        const snapshot = await query.get();
        const services = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Filter by isActive if specified (client-side filter since it's boolean)
        let filteredServices = services;
        if (isActive !== '') {
            const activeFilter = isActive === 'true';
            filteredServices = services.filter((service) => service.isVisible === activeFilter);
        }
        res.json({
            success: true,
            data: {
                services: filteredServices,
                totalCount: filteredServices.length
            }
        });
    }
    catch (error) {
        console.error('Error getting services:', error);
        next(error);
    }
};
exports.getServices = getServices;
/**
 * Create a new service
 */
const createService = async (req, res, next) => {
    try {
        const serviceData = req.body;
        const adminId = req.user?.uid;
        console.log('🔄 Backend: createService started', {
            adminId,
            serviceDataKeys: Object.keys(serviceData),
            serviceData: JSON.stringify(serviceData, null, 2)
        });
        // Add admin metadata
        const newService = {
            ...serviceData,
            id: undefined, // Will be auto-generated
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: adminId,
            lastModifiedBy: adminId,
            isActive: true, // Ensure service is active by default
            stats: {
                totalBookings: 0,
                averageRating: 0,
                totalReviews: 0,
                bookingConversionRate: 0,
                cancelationRate: 0,
                noShowRate: 0,
                popularityScore: 0
            }
        };
        console.log('🆕 Backend: Prepared service for creation', {
            newServiceKeys: Object.keys(newService),
            isActive: newService.isActive,
            pricing: newService.pricing,
            capacity: newService.capacity
        });
        // Create the service
        const serviceRef = await firebase_1.db.collection('services').add(newService);
        console.log('✅ Backend: Service created in Firestore', {
            serviceId: serviceRef.id
        });
        // Get the created service
        const createdService = await serviceRef.get();
        console.log('📄 Backend: Retrieved created service', {
            exists: createdService.exists,
            data: createdService.data()
        });
        // Log the action
        await firebase_1.db.collection('auditLogs').add({
            adminId,
            action: 'CREATE_SERVICE',
            resourceType: 'service',
            resourceId: serviceRef.id,
            details: {
                serviceName: serviceData.name,
                serviceType: serviceData.type
            },
            timestamp: new Date()
        });
        const responseData = {
            success: true,
            data: {
                id: serviceRef.id,
                ...createdService.data()
            }
        };
        console.log('✅ Backend: Sending success response', {
            responseSuccess: responseData.success,
            serviceId: responseData.data.id,
            serviceName: responseData.data.name
        });
        res.status(201).json(responseData);
    }
    catch (error) {
        console.error('❌ Backend: Error creating service:', {
            error: error?.message || 'Unknown error',
            stack: error?.stack,
            adminId: req.user?.uid
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create service',
            details: error?.message || 'Unknown error'
        });
    }
};
exports.createService = createService;
/**
 * Update an existing service
 */
const updateService = async (req, res, next) => {
    try {
        const serviceId = req.params['serviceId'];
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                error: 'Service ID is required'
            });
        }
        const updateData = req.body;
        const adminId = req.user?.uid;
        // Check if service exists
        const serviceDoc = await firebase_1.db.collection('services').doc(serviceId).get();
        if (!serviceDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }
        // Update the service
        const updatedService = {
            ...updateData,
            updatedAt: new Date(),
            lastModifiedBy: adminId
        };
        await firebase_1.db.collection('services').doc(serviceId).update(updatedService);
        // Get the updated service
        const updated = await firebase_1.db.collection('services').doc(serviceId).get();
        // Log the action
        await firebase_1.db.collection('auditLogs').add({
            adminId,
            action: 'UPDATE_SERVICE',
            resourceType: 'service',
            resourceId: serviceId,
            details: {
                updatedFields: Object.keys(updateData),
                serviceName: updated.data()?.['name']
            },
            timestamp: new Date()
        });
        return res.json({
            success: true,
            data: {
                id: serviceId,
                ...updated.data()
            }
        });
    }
    catch (error) {
        console.error('Error updating service:', error);
        next(error);
    }
};
exports.updateService = updateService;
/**
 * Delete a service
 */
const deleteService = async (req, res, next) => {
    try {
        const serviceId = req.params['serviceId'];
        if (!serviceId) {
            return res.status(400).json({
                success: false,
                error: 'Service ID is required'
            });
        }
        const adminId = req.user?.uid;
        // Check if service exists
        const serviceDoc = await firebase_1.db.collection('services').doc(serviceId).get();
        if (!serviceDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }
        const serviceName = serviceDoc.data()?.['name'];
        // Check for active bookings
        const activeBookingsSnapshot = await firebase_1.db.collection('bookings')
            .where('serviceId', '==', serviceId)
            .where('status', 'in', ['pending', 'confirmed'])
            .get();
        if (!activeBookingsSnapshot.empty) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete service with active bookings'
            });
        }
        // Instead of hard delete, mark as deleted
        await firebase_1.db.collection('services').doc(serviceId).update({
            isVisible: false,
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: adminId,
            updatedAt: new Date(),
            lastModifiedBy: adminId
        });
        // Log the action
        await firebase_1.db.collection('auditLogs').add({
            adminId,
            action: 'DELETE_SERVICE',
            resourceType: 'service',
            resourceId: serviceId,
            details: {
                serviceName,
                deletionType: 'soft_delete'
            },
            timestamp: new Date()
        });
        return res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting service:', error);
        next(error);
    }
};
exports.deleteService = deleteService;
/**
 * Get all bookings with filtering and pagination
 */
const getBookings = async (req, res, next) => {
    try {
        const { page = '1', limit = '20', status = '', serviceId = '', customerId = '', dateFrom = '', dateTo = '', lastDocId = '' } = req.query;
        let query = firebase_1.db.collection('bookings');
        // Add filters
        if (status) {
            query = query.where('status', '==', status);
        }
        if (serviceId) {
            query = query.where('serviceId', '==', serviceId);
        }
        if (customerId) {
            query = query.where('customerId', '==', customerId);
        }
        if (dateFrom) {
            query = query.where('startDate', '>=', new Date(dateFrom));
        }
        if (dateTo) {
            query = query.where('startDate', '<=', new Date(dateTo));
        }
        // Default ordering
        query = query.orderBy('createdAt', 'desc');
        // Handle pagination
        if (lastDocId) {
            const lastDoc = await firebase_1.db.collection('bookings').doc(lastDocId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }
        // Apply limit
        query = query.limit(Number(limit));
        const snapshot = await query.get();
        // Enrich bookings with customer and service data
        const bookings = [];
        for (const doc of snapshot.docs) {
            const booking = doc.data();
            // Get customer info
            let customerName = 'Unknown Customer';
            let customerEmail = '';
            if (booking['customerId']) {
                try {
                    const customerDoc = await firebase_1.db.collection('customers').doc(booking['customerId']).get();
                    if (customerDoc.exists) {
                        const customer = customerDoc.data();
                        customerName = `${customer?.['firstName']} ${customer?.['lastName']}`.trim() || customer?.['email'] || 'Unknown Customer';
                        customerEmail = customer?.['email'] || '';
                    }
                }
                catch (error) {
                    console.warn('Could not fetch customer for booking:', booking['customerId']);
                }
            }
            // Get service info
            let serviceName = 'Unknown Service';
            if (booking['serviceId']) {
                try {
                    const serviceDoc = await firebase_1.db.collection('services').doc(booking['serviceId']).get();
                    if (serviceDoc.exists) {
                        serviceName = serviceDoc.data()?.['name'] || 'Unknown Service';
                    }
                }
                catch (error) {
                    console.warn('Could not fetch service for booking:', booking['serviceId']);
                }
            }
            bookings.push({
                id: doc.id,
                ...booking,
                customerName,
                customerEmail,
                serviceName
            });
        }
        // Get total count for pagination
        const totalSnapshot = await firebase_1.db.collection('bookings').get();
        res.json({
            success: true,
            data: {
                bookings,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalSnapshot.size / Number(limit)),
                    totalCount: totalSnapshot.size,
                    hasNextPage: snapshot.docs.length === Number(limit),
                    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1]?.id : null
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting bookings:', error);
        next(error);
    }
};
exports.getBookings = getBookings;
/**
 * Update booking status
 */
const updateBookingStatus = async (req, res, next) => {
    try {
        const bookingId = req.params['bookingId'];
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                error: 'Booking ID is required'
            });
        }
        const { status, notes } = req.body;
        const adminId = req.user?.uid;
        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid booking status'
            });
        }
        // Check if booking exists
        const bookingDoc = await firebase_1.db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        const previousStatus = bookingDoc.data()?.['status'];
        // Update booking
        const updateData = {
            status,
            updatedAt: new Date(),
            lastModifiedBy: adminId
        };
        if (notes) {
            updateData.adminNotes = notes;
        }
        // Add status-specific timestamps
        if (status === 'confirmed') {
            updateData.confirmedAt = new Date();
        }
        else if (status === 'completed') {
            updateData.completedAt = new Date();
        }
        else if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }
        await firebase_1.db.collection('bookings').doc(bookingId).update(updateData);
        // Get updated booking
        const updatedBooking = await firebase_1.db.collection('bookings').doc(bookingId).get();
        // Log the action
        await firebase_1.db.collection('auditLogs').add({
            adminId,
            action: 'UPDATE_BOOKING_STATUS',
            resourceType: 'booking',
            resourceId: bookingId,
            details: {
                previousStatus,
                newStatus: status,
                notes: notes || null
            },
            timestamp: new Date()
        });
        return res.json({
            success: true,
            data: {
                id: bookingId,
                ...updatedBooking.data()
            }
        });
    }
    catch (error) {
        console.error('Error updating booking status:', error);
        next(error);
    }
};
exports.updateBookingStatus = updateBookingStatus;
/**
 * Get business settings
 */
const getBusinessSettings = async (req, res, next) => {
    try {
        // Get business settings from Firestore
        const settingsDoc = await firebase_1.db.collection('businessSettings').doc('main').get();
        let settings;
        if (settingsDoc.exists) {
            settings = settingsDoc.data();
        }
        else {
            // Return default settings if none exist
            settings = getDefaultBusinessSettings();
        }
        res.json({
            success: true,
            data: settings
        });
    }
    catch (error) {
        console.error('Error getting business settings:', error);
        next(error);
    }
};
exports.getBusinessSettings = getBusinessSettings;
/**
 * Update business settings
 */
const updateBusinessSettings = async (req, res, next) => {
    try {
        const settingsData = req.body;
        const adminId = req.user?.uid;
        // Update settings with metadata
        const updatedSettings = {
            ...settingsData,
            updatedAt: new Date(),
            lastModifiedBy: adminId
        };
        // Save to Firestore
        await firebase_1.db.collection('businessSettings').doc('main').set(updatedSettings, { merge: true });
        // Log the action
        await firebase_1.db.collection('auditLogs').add({
            adminId,
            action: 'UPDATE_BUSINESS_SETTINGS',
            resourceType: 'business_settings',
            resourceId: 'main',
            details: {
                updatedSections: Object.keys(settingsData)
            },
            timestamp: new Date()
        });
        res.json({
            success: true,
            data: updatedSettings
        });
    }
    catch (error) {
        console.error('Error updating business settings:', error);
        next(error);
    }
};
exports.updateBusinessSettings = updateBusinessSettings;
/**
 * Get default business settings
 */
function getDefaultBusinessSettings() {
    return {
        businessInfo: {
            name: 'AlphaSUP',
            description: 'Premium SUP kiralama ve tur hizmetleri',
            address: 'İstanbul, Türkiye',
            phone: '+90 XXX XXX XX XX',
            email: 'info@alphasupack.com',
            website: 'https://alphasupack.com',
            taxNumber: '',
            registrationNumber: ''
        },
        operationalInfo: {
            operatingHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: true, openTime: '08:00', closeTime: '19:00' },
                sunday: { isOpen: true, openTime: '08:00', closeTime: '19:00' }
            },
            timezone: 'Europe/Istanbul',
            seasonalOperations: {
                summerSeason: {
                    startDate: '2025-05-01',
                    endDate: '2025-09-30'
                },
                winterSeason: {
                    startDate: '2025-10-01',
                    endDate: '2025-04-30'
                }
            }
        },
        bookingSettings: {
            advanceBookingDays: 30,
            minimumAdvanceHours: 2,
            maxGroupSize: 20,
            allowInstantBooking: false,
            requireDeposit: true,
            depositPercentage: 30
        },
        policySettings: {
            cancellationPolicy: {
                freeUntilHours: 24,
                noRefundAfterHours: 2,
                partialRefundPercentage: 50
            },
            weatherPolicy: {
                minWindSpeedKmh: 0,
                maxWindSpeedKmh: 30,
                minVisibilityKm: 1,
                allowedWeatherConditions: ['clear', 'partly_cloudy', 'cloudy']
            },
            safetyPolicy: {
                minAge: 8,
                maxAge: 99,
                swimmingAbilityRequired: true,
                lifeJacketMandatory: true
            }
        },
        notifications: {
            enableEmailNotifications: true,
            enableSMSNotifications: true,
            enablePushNotifications: false,
            autoConfirmBookings: false,
            sendReminders: true,
            reminderHoursBeforeActivity: 24
        },
        integrations: {
            stripeConnected: false,
            googleCalendarConnected: false,
            weatherAPIConnected: false,
            smsProviderConnected: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
//# sourceMappingURL=adminController.js.map