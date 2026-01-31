const express = require('express');
const admin = require('firebase-admin');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const db = admin.firestore();

// Get heatmap data for lost items by location
const getHeatmapData = async () => {
  try {
    const lostItemsSnapshot = await db.collection('LostItems').get();
    const heatmapData = [];
    const locationCounts = {};

    lostItemsSnapshot.forEach(doc => {
      const item = doc.data();
      if (item.location) {
        const location = item.location.toLowerCase();
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });

    // Convert location counts to heatmap data
    for (const [location, count] of Object.entries(locationCounts)) {
      heatmapData.push({
        location,
        count,
        intensity: Math.min(count / 10, 1) // Normalize intensity 0-1
      });
    }

    return heatmapData.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    return [];
  }
};

// Get dashboard data
router.get('/dashboard-data', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Get total counts
    const [lostItemsSnapshot, foundItemsSnapshot, usersSnapshot, matchesSnapshot, handoversSnapshot] = await Promise.all([
      db.collection('LostItems').get(),
      db.collection('FoundItems').get(),
      db.collection('Users').get(),
      db.collection('Matches').get(),
      db.collection('Handovers').get()
    ]);

    // Calculate success rate
    const completedHandovers = handoversSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    const failedVerifications = handoversSnapshot.docs.filter(doc => doc.data().status === 'failed').length;
    const successRate = handoversSnapshot.size > 0 ? (completedHandovers / handoversSnapshot.size) * 100 : 0;

    // Get trust score distribution
    const trustScoreDistribution = {
      low: 0,    // 0-33
      medium: 0, // 34-66
      high: 0    // 67-100
    };

    usersSnapshot.forEach(doc => {
      const trustScore = doc.data().trust_score || 0;
      if (trustScore <= 33) trustScoreDistribution.low++;
      else if (trustScore <= 66) trustScoreDistribution.medium++;
      else trustScoreDistribution.high++;
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLostItems = lostItemsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().created_at;
      return createdAt && new Date(createdAt.toDate()) > thirtyDaysAgo;
    });

    const recentFoundItems = foundItemsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().created_at;
      return createdAt && new Date(createdAt.toDate()) > thirtyDaysAgo;
    });

    // Fraud alerts (users with low trust scores and recent failed verifications)
    const fraudAlerts = [];
    const lowTrustUsers = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return (data.trust_score || 0) < 30;
    });

    for (const userDoc of lowTrustUsers) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check for recent failed verifications
      const failedHandovers = handoversSnapshot.docs.filter(doc => {
        const handover = doc.data();
        return handover.owner_id === userId && handover.status === 'failed';
      });

      if (failedHandovers.length > 0) {
        fraudAlerts.push({
          user_id: userId,
          name: userData.name || 'Unknown',
          email: userData.email || 'N/A',
          trust_score: userData.trust_score || 0,
          recent_failures: failedHandovers.length,
          alert_level: userData.trust_score < 10 ? 'high' : 'medium'
        });
      }
    }

    // Get category distribution
    const categoryDistribution = {};
    lostItemsSnapshot.forEach(doc => {
      const category = doc.data().category || 'Other';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });

    // Get heatmap data
    const heatmapData = await getHeatmapData();

    const dashboardData = {
      totals: {
        lost_items: lostItemsSnapshot.size,
        found_items: foundItemsSnapshot.size,
        users: usersSnapshot.size,
        matches: matchesSnapshot.size,
        recoveries: completedHandovers,
        failed_verifications: failedVerifications
      },
      success_rate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      trust_score_distribution: trustScoreDistribution,
      recent_activity: {
        lost_items_last_30_days: recentLostItems.length,
        found_items_last_30_days: recentFoundItems.length
      },
      category_distribution: categoryDistribution,
      fraud_alerts: fraudAlerts.sort((a, b) => b.alert_level === 'high' ? -1 : 1),
      heatmap_data: heatmapData,
      generated_at: new Date().toISOString()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Approve handover
router.post('/approve-handover', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { handoverId } = req.body;

    if (!handoverId) {
      return res.status(400).json({ error: 'Handover ID is required' });
    }

    const handoverRef = db.collection('Handovers').doc(handoverId);
    const handoverDoc = await handoverRef.get();

    if (!handoverDoc.exists) {
      return res.status(404).json({ error: 'Handover not found' });
    }

    const handover = handoverDoc.data();

    if (handover.status !== 'pending') {
      return res.status(400).json({ error: 'Handover is not in pending status' });
    }

    // Generate OTP for secure handover
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await handoverRef.update({
      status: 'approved',
      otp: otp,
      approved_by: req.user.uid,
      approved_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the approval
    await db.collection('AdminLogs').add({
      action: 'approve_handover',
      handover_id: handoverId,
      admin_id: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Handover approved successfully',
      otp: otp // In production, send this via SMS/email instead
    });
  } catch (error) {
    console.error('Approve handover error:', error);
    res.status(500).json({ error: 'Failed to approve handover' });
  }
});

// Reject handover
router.post('/reject-handover', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { handoverId, reason } = req.body;

    if (!handoverId) {
      return res.status(400).json({ error: 'Handover ID is required' });
    }

    const handoverRef = db.collection('Handovers').doc(handoverId);
    const handoverDoc = await handoverRef.get();

    if (!handoverDoc.exists) {
      return res.status(404).json({ error: 'Handover not found' });
    }

    const handover = handoverDoc.data();

    if (handover.status !== 'pending') {
      return res.status(400).json({ error: 'Handover is not in pending status' });
    }

    await handoverRef.update({
      status: 'rejected',
      rejection_reason: reason || 'Rejected by admin',
      rejected_by: req.user.uid,
      rejected_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the rejection
    await db.collection('AdminLogs').add({
      action: 'reject_handover',
      handover_id: handoverId,
      admin_id: req.user.uid,
      reason: reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Handover rejected successfully' });
  } catch (error) {
    console.error('Reject handover error:', error);
    res.status(500).json({ error: 'Failed to reject handover' });
  }
});

// Get all handovers for admin review
router.get('/handovers', verifyToken, requireAdmin, async (req, res) => {
  try {
    const handoversSnapshot = await db.collection('Handovers')
      .orderBy('created_at', 'desc')
      .get();

    const handovers = [];
    handoversSnapshot.forEach(doc => {
      handovers.push({ id: doc.id, ...doc.data() });
    });

    res.json({ handovers });
  } catch (error) {
    console.error('Get handovers error:', error);
    res.status(500).json({ error: 'Failed to fetch handovers' });
  }
});

module.exports = router;
