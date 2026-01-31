const express = require('express');
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();
const db = admin.firestore();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate QR code data
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(JSON.stringify(data));
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Verify owner ownership
router.post('/verify-owner', verifyToken, async (req, res) => {
  try {
    const { matchId, answers } = req.body;

    if (!matchId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Match ID and answers array are required' });
    }

    // Get the match
    const matchDoc = await db.collection('Matches').doc(matchId).get();

    if (!matchDoc.exists) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchDoc.data();

    // Get the lost item to check ownership and get verification answers
    const lostItemDoc = await db.collection('LostItems').doc(match.lost_item_id).get();

    if (!lostItemDoc.exists) {
      return res.status(404).json({ error: 'Lost item not found' });
    }

    const lostItem = lostItemDoc.data();

    // Check if user owns this lost item
    if (lostItem.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Scoring verification answers with partial matching
    const correctAnswers = lostItem.verification_answers || [];
    let correctCount = 0;
    
    answers.forEach((answer, index) => {
      if (index < correctAnswers.length) {
        const answerLower = answer.toLowerCase().trim();
        const correctLower = correctAnswers[index].toLowerCase().trim();
        
        // Exact match or partial match
        if (answerLower === correctLower || 
            correctLower.includes(answerLower) || 
            answerLower.includes(correctLower)) {
          correctCount++;
        }
      }
    });

    // At least 2 out of 3 answers correct to verify
    const isVerified = correctCount >= Math.ceil(correctAnswers.length * 0.66);

    // Update user trust score
    const userRef = db.collection('Users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const currentTrustScore = userDoc?.data?.().trust_score || 0;

    let newTrustScore = currentTrustScore;
    if (isVerified) {
      newTrustScore = Math.min(100, currentTrustScore + 1); // +1 for success
    } else {
      newTrustScore = Math.max(0, currentTrustScore - 2); // -2 for failure
    }

    await userRef.update({ trust_score: newTrustScore });

    // Create or update handover record
    const handoverData = {
      match_id: matchId,
      item_id: match.lost_item_id,
      owner_id: req.user.uid,
      finder_id: match.found_item_id.split('/')[0], // Extract finder ID from found item ID
      status: isVerified ? 'verified' : 'failed',
      verification_answers: answers,
      correct_answers: correctAnswers,
      correctCount: correctCount,
      verified_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const handoverRef = db.collection('Handovers').doc(matchId);
    await handoverRef.set(handoverData, { merge: true });

    res.json({
      status: isVerified ? 'verified' : 'failed',
      message: isVerified ? 'Ownership verified successfully!' : 'Verification failed. Answers do not match.',
      updated_trust_score: newTrustScore,
      handover_id: matchId,
      correctCount: correctCount,
      totalQuestions: correctAnswers.length
    });
  } catch (error) {
    console.error('Verify owner error:', error);
    res.status(500).json({ error: 'Failed to verify ownership' });
  }
});

// Generate OTP and QR code for handover
router.post('/generate-otp', verifyToken, async (req, res) => {
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

    // Check if user is the finder or owner
    if (handover.owner_id !== req.user.uid && handover.finder_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already verified
    if (handover.status !== 'verified') {
      return res.status(400).json({ error: 'Handover must be verified first' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate QR code data
    const qrData = {
      handover_id: handoverId,
      otp: otp,
      owner_id: handover.owner_id,
      finder_id: handover.finder_id,
      item_id: handover.item_id,
      timestamp: Date.now()
    };

    const qrCode = await generateQRCode(qrData);

    // Update handover with OTP
    await handoverRef.update({
      otp: otp,
      otp_expiry: otpExpiry,
      qr_code: qrCode,
      status: 'otp_generated',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log the OTP generation
    await db.collection('HandoverLogs').add({
      handover_id: handoverId,
      action: 'otp_generated',
      user_id: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'OTP generated successfully',
      otp: otp,
      otp_expiry: otpExpiry,
      qr_code: qrCode,
      handover_id: handoverId
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Confirm handover with OTP verification
router.post('/confirm-handover', verifyToken, async (req, res) => {
  try {
    const { handoverId, otp } = req.body;

    if (!handoverId || !otp) {
      return res.status(400).json({ error: 'Handover ID and OTP are required' });
    }

    const handoverRef = db.collection('Handovers').doc(handoverId);
    const handoverDoc = await handoverRef.get();

    if (!handoverDoc.exists) {
      return res.status(404).json({ error: 'Handover not found' });
    }

    const handover = handoverDoc.data();

    // Check if user is involved in this handover
    if (handover.owner_id !== req.user.uid && handover.finder_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify OTP
    if (!handover.otp || handover.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check OTP expiry
    if (handover.otp_expiry && new Date() > new Date(handover.otp_expiry)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Update handover status
    await handoverRef.update({
      status: 'completed',
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      completed_by: req.user.uid,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update item status to recovered
    const itemRef = db.collection('LostItems').doc(handover.item_id);
    await itemRef.update({
      status: 'recovered',
      recovered_at: admin.firestore.FieldValue.serverTimestamp(),
      recovered_by: req.user.uid
    });

    // Create digital receipt
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const receiptData = {
      handover_id: handoverId,
      item_id: handover.item_id,
      owner_id: handover.owner_id,
      finder_id: handover.finder_id,
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      receipt_number: receiptNumber,
      status: 'completed',
      verified_by: req.user.uid
    };

    const receiptRef = await db.collection('Receipts').add(receiptData);

    // Update both users' stats
    const ownerRef = db.collection('Users').doc(handover.owner_id);
    const finderRef = db.collection('Users').doc(handover.finder_id);

    await Promise.all([
      ownerRef.update({
        items_recovered: admin.firestore.FieldValue.increment(1),
        last_recovery_at: admin.firestore.FieldValue.serverTimestamp()
      }),
      finderRef.update({
        items_returned: admin.firestore.FieldValue.increment(1),
        last_return_at: admin.firestore.FieldValue.serverTimestamp()
      })
    ]);

    // Log the completion
    await db.collection('HandoverLogs').add({
      handover_id: handoverId,
      action: 'handover_completed',
      user_id: req.user.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Handover completed successfully!',
      receipt: {
        id: receiptRef.id,
        ...receiptData
      }
    });
  } catch (error) {
    console.error('Confirm handover error:', error);
    res.status(500).json({ error: 'Failed to confirm handover' });
  }
});

// Get handover details
router.get('/:handoverId', verifyToken, async (req, res) => {
  try {
    const { handoverId } = req.params;

    const handoverDoc = await db.collection('Handovers').doc(handoverId).get();

    if (!handoverDoc.exists) {
      return res.status(404).json({ error: 'Handover not found' });
    }

    const handover = handoverDoc.data();

    // Check if user is involved in this handover
    if (handover.owner_id !== req.user.uid && handover.finder_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ handover: { id: handoverDoc.id, ...handover } });
  } catch (error) {
    console.error('Get handover error:', error);
    res.status(500).json({ error: 'Failed to fetch handover' });
  }
});

module.exports = router;
