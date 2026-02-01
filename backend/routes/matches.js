const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { calculateMatchScore, getConfidenceLevel, generateMatchExplanation, findMatches } = require('../services/matchingService');

const router = express.Router();

/**
 * GET /api/matches/find
 * Find all matches for items in the system
 * Optionally filter by userId
 */
router.get('/find', async (req, res) => {
  try {
    const { userId } = req.query;

    // Get all lost items
    let lostQuery = req.db.collection('LostItems');
    if (userId) {
      lostQuery = lostQuery.where('userId', '==', userId);
    }
    const lostSnapshot = await lostQuery.get();
    const lostItems = lostSnapshot.docs.map(doc => doc.data());

    if (lostItems.length === 0) {
      return res.json({
        message: 'No lost items found',
        matches: []
      });
    }

    // Get all found items
    const foundSnapshot = await req.db.collection('FoundItems').get();
    const foundItems = foundSnapshot.docs.map(doc => doc.data());

    if (foundItems.length === 0) {
      return res.json({
        message: 'No found items available for matching',
        matches: []
      });
    }

    // Calculate matches for each lost item
    const allMatches = [];
    for (const lostItem of lostItems) {
      const matches = findMatches(lostItem, foundItems);
      if (matches.length > 0) {
        allMatches.push({
          lostItem,
          matches: matches.map(m => ({
            foundItem: m.foundItem,
            score: m.score,
            confidence: m.confidence,
            explanation: m.explanation
          }))
        });
      }
    }

    res.json({
      totalMatches: allMatches.length,
      matches: allMatches
    });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({
      error: 'Matching Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/matches/item/:itemId
 * Get matches for a specific lost item
 */
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Get the lost item
    const lostDoc = await req.db.collection('LostItems').doc(itemId).get();
    if (!lostDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lost item not found'
      });
    }

    const lostItem = lostDoc.data();

    if (lostItem.status !== 'lost') {
      return res.status(400).json({
        error: 'Invalid Operation',
        message: 'Item must be a lost item to get matches'
      });
    }

    // Get all found items
    const foundSnapshot = await req.db.collection('FoundItems').get();
    const foundItems = foundSnapshot.docs.map(doc => doc.data());

    // Find matches
    const matches = findMatches(lostItem, foundItems);

    // Store matches in item document
    await req.db.collection('LostItems').doc(itemId).update({
      matches: matches.map(m => ({
        foundItemId: m.foundItem.id,
        score: m.score,
        confidence: m.confidence.level,
        updatedAt: new Date().toISOString()
      }))
    });

    res.json({
      itemId,
      itemName: lostItem.itemName,
      matchCount: matches.length,
      matches: matches.map(m => ({
        foundItem: m.foundItem,
        score: m.score,
        confidence: m.confidence,
        explanation: m.explanation
      }))
    });
  } catch (error) {
    console.error('Get item matches error:', error);
    res.status(500).json({
      error: 'Matching Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/matches/user-matches
 * Get all matches for current user's lost items
 * Requires: authentication
 */
router.get('/user-matches', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's lost items
    const lostSnapshot = await req.db
      .collection('LostItems')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const lostItems = lostSnapshot.docs.map(doc => doc.data());

    if (lostItems.length === 0) {
      return res.json({
        message: 'No lost items to get matches for',
        userMatches: []
      });
    }

    // Get all found items
    const foundSnapshot = await req.db.collection('FoundItems').get();
    const foundItems = foundSnapshot.docs.map(doc => doc.data());

    // Calculate matches for each lost item
    const userMatches = [];
    for (const lostItem of lostItems) {
      const matches = findMatches(lostItem, foundItems);
      userMatches.push({
        lostItem,
        matches: matches.map(m => ({
          foundItem: m.foundItem,
          score: m.score,
          confidence: m.confidence,
          explanation: m.explanation
        }))
      });
    }

    res.json({
      userId,
      totalItems: lostItems.length,
      itemsWithMatches: userMatches.filter(m => m.matches.length > 0).length,
      userMatches
    });
  } catch (error) {
    console.error('Get user matches error:', error);
    res.status(500).json({
      error: 'Matching Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/matches/request-claim
 * Request claim for a found item matching lost item
 * Requires: authentication
 */
router.post('/request-claim', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { lostItemId, foundItemId } = req.body;

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Lost item ID and found item ID are required'
      });
    }

    // Get lost item
    const lostDoc = await req.db.collection('LostItems').doc(lostItemId).get();
    if (!lostDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lost item not found'
      });
    }

    const lostItem = lostDoc.data();

    // Verify ownership of lost item
    if (lostItem.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only request claims for your own lost items'
      });
    }

    // Get found item
    const foundDoc = await req.db.collection('FoundItems').doc(foundItemId).get();
    if (!foundDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Found item not found'
      });
    }

    // Create claim request
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const claimData = {
      id: claimId,
      lostItemId,
      foundItemId,
      claimerUserId: userId,
      finderUserId: lostItem.userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save claim request
    await req.db.collection('claims').doc(claimId).set(claimData);

    // Update found item with claim request
    const foundItem = foundDoc.data();
    const claimRequests = foundItem.claimRequests || [];
    claimRequests.push(claimId);
    await req.db.collection('FoundItems').doc(foundItemId).update({
      claimRequests
    });

    res.status(201).json({
      message: 'Claim request submitted successfully',
      claim: claimData
    });
  } catch (error) {
    console.error('Request claim error:', error);
    res.status(500).json({
      error: 'Claim Request Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/matches/claims/:claimId
 * Get claim details
 */
router.get('/claims/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;

    const claimDoc = await req.db.collection('claims').doc(claimId).get();
    if (!claimDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Claim not found'
      });
    }

    const claim = claimDoc.data();

    // Get related items
    const lostItem = await (await req.db.collection('LostItems').doc(claim.lostItemId).get()).data();
    const foundItem = await (await req.db.collection('FoundItems').doc(claim.foundItemId).get()).data();

    res.json({
      claim,
      lostItem,
      foundItem
    });
  } catch (error) {
    console.error('Get claim error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

module.exports = router;