const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 * Requires: authentication
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;

        // In a real app, we would query a notifications collection
        // For demo, we'll generate some mock notifications based on user context
        const notifications = [
            {
                id: '1',
                type: 'system',
                title: 'Welcome to Lost&Found AI+',
                message: 'Your account has been successfully created.',
                read: true,
                date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            }
        ];

        // If user has reported verify items, add a match alert
        if (req.user.itemsReported > 0) {
            notifications.unshift({
                id: '2',
                type: 'match',
                title: 'Potential Match Found!',
                message: 'We found an item that matches your lost "Black Wallet". Check it out!',
                read: false,
                actionLink: '/matches',
                date: new Date().toISOString()
            });
        }

        res.json({
            notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            error: 'Fetch Failed',
            message: error.message
        });
    }
});

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Mock success
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Update Failed' });
    }
});

module.exports = router;
