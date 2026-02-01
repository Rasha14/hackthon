const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * Middleware to verify admin access
 */
const ensureAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    requireAdmin(req, res, next);
  });
};

/**
 * GET /api/admin/dashboard-data
 * Get admin dashboard analytics
 * Requires: admin authentication
 */
router.get('/dashboard-data', ensureAdmin, async (req, res) => {
  try {
    // Get total counts
    const usersSnapshot = await req.db.collection('Users').get();
    const lostItemsSnapshot = await req.db.collection('LostItems').get();
    const foundItemsSnapshot = await req.db.collection('FoundItems').get();
    const matchesSnapshot = await req.db.collection('Matches').get();
    const handoversSnapshot = await req.db.collection('Handovers').get();

    const users = usersSnapshot.docs.map(doc => doc.data());
    const lostItems = lostItemsSnapshot.docs.map(doc => doc.data());
    const foundItems = foundItemsSnapshot.docs.map(doc => doc.data());
    const matches = matchesSnapshot.docs.map(doc => doc.data());
    const handovers = handoversSnapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const lostItemCount = lostItems.length;
    const foundItemCount = foundItems.length;
    const recoveredItems = lostItems.filter(i => i.status === 'recovered').length;

    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const pendingMatches = matches.filter(m => m.status === 'pending').length;
    const verifiedMatches = matches.filter(m => m.status === 'verified').length;

    const completedHandovers = handovers.filter(h => h.status === 'completed').length;
    const allItems = [...lostItems, ...foundItems];
    const recoveryRate = lostItemCount > 0 ? ((recoveredItems / lostItemCount) * 100).toFixed(2) : 0;

    // Category distribution
    const categoryDist = {};
    allItems.forEach(item => {
      categoryDist[item.category] = (categoryDist[item.category] || 0) + 1;
    });

    // Trust score distribution
    const trustScoreBuckets = {
      excellent: users.filter(u => u.trustScore >= 90).length,
      good: users.filter(u => u.trustScore >= 70 && u.trustScore < 90).length,
      fair: users.filter(u => u.trustScore >= 50 && u.trustScore < 70).length,
      poor: users.filter(u => u.trustScore < 50).length
    };

    // Suspicious users (low trust score + many failed verifications)
    const suspiciousUsers = users.filter(u => u.trustScore < 40 || u.failedVerifications > 3);

    res.json({
      summary: {
        totalUsers: users.length,
        totalLostItems: lostItemCount,
        totalFoundItems: foundItemCount,
        totalMatches: matches.length,
        totalHandovers: handovers.length
      },
      items: {
        lost: lostItemCount,
        found: foundItemCount,
        recovered: recoveredItems,
        recoveryRate: `${recoveryRate}%`
      },
      matches: {
        total: matches.length,
        completed: completedMatches,
        pending: pendingMatches,
        verified: verifiedMatches,
        completionRate: matches.length > 0 ? ((completedMatches / matches.length) * 100).toFixed(2) : 0
      },
      handovers: {
        total: handovers.length,
        completed: completedHandovers,
        pending: handovers.filter(h => h.status === 'pending').length
      },
      categories: categoryDist,
      trustScoreDistribution: trustScoreBuckets,
      suspiciousUsers: suspiciousUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        trustScore: u.trustScore,
        failedVerifications: u.failedVerifications
      }))
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      error: 'Dashboard Fetch Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with stats
 * Requires: admin authentication
 */
router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const usersSnapshot = await req.db.collection('Users').orderBy('createdAt', 'desc').get();
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password; // Don't send passwords
      return data;
    });

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/claims
 * Get all claims for review
 * Requires: admin authentication
 */
router.get('/claims', ensureAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = req.db.collection('claims');
    if (status) {
      query = query.where('status', '==', status);
    }

    const claimsSnapshot = await query.orderBy('createdAt', 'desc').get();
    const claims = claimsSnapshot.docs.map(doc => doc.data());

    res.json({
      count: claims.length,
      claims
    });
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/claim/:claimId/approve
 * Approve a claim
 * Requires: admin authentication
 */
router.post('/claim/:claimId/approve', ensureAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;

    const claimDoc = await req.db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Claim not found'
      });
    }

    await req.db.collection('claims').doc(claimId).update({
      status: 'verified',
      approvedBy: req.user.userId,
      approvedAt: new Date().toISOString()
    });

    res.json({
      message: 'Claim approved successfully'
    });
  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({
      error: 'Approval Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/claim/:claimId/reject
 * Reject a claim
 * Requires: admin authentication
 */
router.post('/claim/:claimId/reject', ensureAdmin, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { reason } = req.body;

    const claimDoc = await req.db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Claim not found'
      });
    }

    await req.db.collection('claims').doc(claimId).update({
      status: 'rejected',
      rejectedBy: req.user.userId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || ''
    });

    res.json({
      message: 'Claim rejected successfully'
    });
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({
      error: 'Rejection Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/handovers
 * Get all handovers for admin review
 * Requires: admin authentication
 */
router.get('/handovers', ensureAdmin, async (req, res) => {
  try {
    const { status } = req.query;

    let query = req.db.collection('handovers');
    if (status) {
      query = query.where('status', '==', status);
    }

    const handoversSnapshot = await query.orderBy('createdAt', 'desc').get();
    const handovers = handoversSnapshot.docs.map(doc => doc.data());

    res.json({
      count: handovers.length,
      handovers
    });
  } catch (error) {
    console.error('Get handovers error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/user/:userId/disable
 * Disable a user account
 * Requires: admin authentication
 */
router.post('/user/:userId/disable', ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const userDoc = await req.db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    await req.db.collection('Users').doc(userId).update({
      isActive: false,
      disabledAt: new Date().toISOString(),
      disabledBy: req.user.userId,
      disabledReason: reason || ''
    });

    res.json({
      message: 'User account disabled successfully'
    });
  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({
      error: 'User Disable Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/user/:userId/enable
 * Enable a user account
 * Requires: admin authentication
 */
router.post('/user/:userId/enable', ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await req.db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    await req.db.collection('Users').doc(userId).update({
      isActive: true,
      enabledAt: new Date().toISOString(),
      enabledBy: req.user.userId
    });

    res.json({
      message: 'User account enabled successfully'
    });
  } catch (error) {
    console.error('Enable user error:', error);
    res.status(500).json({
      error: 'User Enable Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/stats/heatmap
 * Get location-based statistics for heatmap
 * Requires: admin authentication
 */
router.get('/stats/heatmap', ensureAdmin, async (req, res) => {
  try {
    const lostItemsSnapshot = await req.db.collection('LostItems').get();
    const lostItems = lostItemsSnapshot.docs.map(doc => doc.data());

    // Group by location
    const locationStats = {};
    lostItems.forEach(item => {
      const location = item.location || 'Unknown';
      locationStats[location] = (locationStats[location] || 0) + 1;
    });

    // Sort by frequency
    const sortedLocations = Object.entries(locationStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    res.json({
      hotspots: Object.fromEntries(sortedLocations),
      totalLocations: Object.keys(locationStats).length
    });
  } catch (error) {
    console.error('Heatmap stats error:', error);
    res.status(500).json({
      error: 'Stats Fetch Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/audit-log
 * Get audit log
 * Requires: admin authentication
 */
router.get('/audit-log', ensureAdmin, async (req, res) => {
  try {
    const logsSnapshot = await req.db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const logs = logsSnapshot.docs.map(doc => doc.data());

    res.json({
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({
      error: 'Audit Log Fetch Failed',
      message: error.message
    });
  }
});

module.exports = router;