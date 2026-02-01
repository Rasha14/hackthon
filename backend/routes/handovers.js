const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate QR code from data
 */
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

/**
 * POST /api/handovers/verify-owner
 * Verify item ownership with verification answers
 * Requires: authentication
 */
router.post('/verify-owner', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { claimId, answers } = req.body;

    if (!claimId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Claim ID and answers array are required'
      });
    }

    // Get claim
    const claimDoc = await req.db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Claim not found'
      });
    }

    const claim = claimDoc.data();

    // Verify that user is the claimer
    if (claim.claimerUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only verify your own claims'
      });
    }

    // Get lost item
    const lostDoc = await req.db.collection('LostItems').doc(claim.lostItemId).get();
    if (!lostDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lost item not found'
      });
    }

    const lostItem = lostDoc.data();

    // Get user
    const userDoc = await req.db.collection('Users').doc(userId).get();
    const userData = userDoc.data();

    // Simple verification: check if answers match expected pattern
    // In production, implement proper answer validation
    const correctAnswers = answers.filter(a => a && a.length > 0).length;
    const minimumCorrect = Math.ceil(answers.length * 0.66); // 66% threshold

    const isVerified = correctAnswers >= minimumCorrect;

    // Update trust score
    let newTrustScore = userData.trustScore || 100;
    if (isVerified) {
      newTrustScore += 5;
      newTrustScore = Math.min(newTrustScore, 100);
    } else {
      newTrustScore -= 10;
      newTrustScore = Math.max(newTrustScore, 0);
    }

    // Update user
    await req.db.collection('Users').doc(userId).update({
      trustScore: newTrustScore,
      successfulVerifications: (userData.successfulVerifications || 0) + (isVerified ? 1 : 0),
      failedVerifications: (userData.failedVerifications || 0) + (isVerified ? 0 : 1)
    });

    // Update claim status
    const newStatus = isVerified ? 'verified' : 'rejected';
    await req.db.collection('claims').doc(claimId).update({
      status: newStatus,
      verificationAnswers: answers,
      verificationScore: (correctAnswers / answers.length) * 100,
      verified: isVerified,
      verifiedAt: new Date().toISOString()
    });

    res.json({
      message: isVerified ? 'Verification successful' : 'Verification failed',
      verified: isVerified,
      score: (correctAnswers / answers.length) * 100,
      newTrustScore,
      trustChange: isVerified ? '+5' : '-10'
    });
  } catch (error) {
    console.error('Verify owner error:', error);
    res.status(500).json({
      error: 'Verification Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/handovers/generate-otp
 * Generate OTP and QR code for handover
 * Requires: authentication
 */
router.post('/generate-otp', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { claimId } = req.body;

    if (!claimId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Claim ID is required'
      });
    }

    // Get claim
    const claimDoc = await req.db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Claim not found'
      });
    }

    const claim = claimDoc.data();

    // Verify that user is the claimer
    if (claim.claimerUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only generate OTP for your own claims'
      });
    }

    // Check if claim is verified
    if (claim.status !== 'verified') {
      return res.status(400).json({
        error: 'Invalid State',
        message: 'Claim must be verified before generating OTP'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate QR code
    const qrData = {
      claimId,
      otp,
      timestamp: new Date().toISOString()
    };
    const qrCode = await generateQRCode(qrData);

    // Create handover record
    const handoverId = `handover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const handoverData = {
      id: handoverId,
      claimId,
      lostItemId: claim.lostItemId,
      foundItemId: claim.foundItemId,
      claimerUserId: claim.claimerUserId,
      finderUserId: claim.finderUserId,
      otp,
      qrCode,
      otpExpiry: otpExpiry.toISOString(),
      status: 'pending',
      location: 'Admin Office',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await req.db.collection('handovers').doc(handoverId).set(handoverData);

    // Update claim status
    await req.db.collection('claims').doc(claimId).update({
      status: 'handover_pending',
      handoverId
    });

    res.status(201).json({
      message: 'OTP and QR code generated successfully',
      handover: {
        handoverId,
        otp,
        qrCode,
        otpExpiry: otpExpiry.toISOString(),
        location: 'Admin Office'
      }
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({
      error: 'OTP Generation Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/handovers/confirm-handover
 * Confirm handover with OTP
 * Requires: authentication
 */
router.post('/confirm-handover', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { handoverId, otp } = req.body;

    if (!handoverId || !otp) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Handover ID and OTP are required'
      });
    }

    // Get handover
    const handoverDoc = await req.db.collection('handovers').doc(handoverId).get();
    if (!handoverDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Handover not found'
      });
    }

    const handover = handoverDoc.data();

    // Check if user is the claimer or finder
    if (handover.claimerUserId !== userId && handover.finderUserId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You cannot confirm this handover'
      });
    }

    // Verify OTP
    if (handover.otp !== otp) {
      return res.status(401).json({
        error: 'Invalid OTP',
        message: 'The OTP provided is incorrect'
      });
    }

    // Check OTP expiry
    const otpExpiry = new Date(handover.otpExpiry);
    if (new Date() > otpExpiry) {
      return res.status(401).json({
        error: 'Expired OTP',
        message: 'The OTP has expired'
      });
    }

    // Update handover status
    const receipt = {
      transactionId: `RCP_${Date.now()}`,
      handoverId,
      claimId: handover.claimId,
      itemId: handover.lostItemId,
      completedAt: new Date().toISOString(),
      location: handover.location
    };

    await req.db.collection('handovers').doc(handoverId).update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      receipt
    });

    // Update lost item status
    await req.db.collection('LostItems').doc(handover.lostItemId).update({
      status: 'recovered',
      recoveredAt: new Date().toISOString(),
      handoverId
    });

    // Update found item status
    await req.db.collection('FoundItems').doc(handover.foundItemId).update({
      status: 'handed_over',
      handoverId
    });

    // Update claim status
    await req.db.collection('claims').doc(handover.claimId).update({
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    // Update user stats
    const userDoc = await req.db.collection('Users').doc(handover.claimerUserId).get();
    await req.db.collection('Users').doc(handover.claimerUserId).update({
      itemsRecovered: (userDoc.data().itemsRecovered || 0) + 1
    });

    res.json({
      message: 'Handover completed successfully',
      receipt
    });
  } catch (error) {
    console.error('Confirm handover error:', error);
    res.status(500).json({
      error: 'Handover Confirmation Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/handovers/:handoverId
 * Get handover details
 */
router.get('/:handoverId', async (req, res) => {
  try {
    const { handoverId } = req.params;

    const handoverDoc = await req.db.collection('handovers').doc(handoverId).get();
    if (!handoverDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Handover not found'
      });
    }

    const handover = handoverDoc.data();

    res.json({
      handover
    });
  } catch (error) {
    console.error('Get handover error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

module.exports = router;