const express = require('express');
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
const { calculateMatchScore } = require('../services/matchingService');

const router = express.Router();
const db = admin.firestore();

// Get AI suggested matches for a lost item
router.get('/match-items', verifyToken, async (req, res) => {
  try {
    const { lostItemId } = req.query;

    if (!lostItemId) {
      return res.status(400).json({ error: 'Lost item ID is required' });
    }

    // Get the lost item
    const lostItemDoc = await db.collection('LostItems').doc(lostItemId).get();

    if (!lostItemDoc.exists) {
      return res.status(404).json({ error: 'Lost item not found' });
    }

    const lostItem = { id: lostItemDoc.id, ...lostItemDoc.data() };

    // Check if user owns this lost item
    if (lostItem.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all found items
    const foundItemsSnapshot = await db.collection('FoundItems').get();
    const foundItems = [];

    foundItemsSnapshot.forEach(doc => {
      foundItems.push({ id: doc.id, ...doc.data() });
    });

    // Calculate match scores for each found item
    const matches = await Promise.all(foundItems.map(async (foundItem) => {
      const score = await calculateMatchScore(lostItem, foundItem);
      return {
        lost_item_id: lostItemId,
        found_item_id: foundItem.id,
        match_score: score.total,
        score_breakdown: score.breakdown,
        found_item: foundItem
      };
    }));

    // Sort by match score (descending) and take top 3
    matches.sort((a, b) => b.match_score - a.match_score);
    const topMatches = matches.slice(0, 3);

    // Save matches to database
    const batch = db.batch();
    topMatches.forEach(match => {
      const matchRef = db.collection('Matches').doc();
      batch.set(matchRef, {
        ...match,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    res.json({
      lost_item: lostItem,
      matches: topMatches
    });
  } catch (error) {
    console.error('Match items error:', error);
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

// Get matches for a specific lost item
router.get('/item-matches/:lostItemId', verifyToken, async (req, res) => {
  try {
    const { lostItemId } = req.params;

    // Check if user owns this lost item
    const lostItemDoc = await db.collection('LostItems').doc(lostItemId).get();
    if (!lostItemDoc.exists || lostItemDoc.data().user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get matches for this lost item
    const matchesSnapshot = await db.collection('Matches')
      .where('lost_item_id', '==', lostItemId)
      .orderBy('match_score', 'desc')
      .get();

    const matches = [];
    matchesSnapshot.forEach(doc => {
      matches.push({ id: doc.id, ...doc.data() });
    });

    res.json({ matches });
  } catch (error) {
    console.error('Get item matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get all matches for current user
router.get('/my-matches', verifyToken, async (req, res) => {
  try {
    // Get matches where user is the owner of lost items
    const lostItemsSnapshot = await db.collection('LostItems')
      .where('user_id', '==', req.user.uid)
      .get();

    const lostItemIds = lostItemsSnapshot.docs.map(doc => doc.id);

    if (lostItemIds.length === 0) {
      return res.json({ matches: [] });
    }

    // Get matches for these lost items
    const matchesPromises = lostItemIds.map(lostItemId =>
      db.collection('Matches')
        .where('lost_item_id', '==', lostItemId)
        .orderBy('match_score', 'desc')
        .get()
    );

    const matchesResults = await Promise.all(matchesPromises);
    const allMatches = [];

    matchesResults.forEach(snapshot => {
      snapshot.forEach(doc => {
        allMatches.push({ id: doc.id, ...doc.data() });
      });
    });

    // Sort by match score and creation time
    allMatches.sort((a, b) => {
      if (b.match_score !== a.match_score) {
        return b.match_score - a.match_score;
      }
      return b.created_at - a.created_at;
    });

    res.json({ matches: allMatches });
  } catch (error) {
    console.error('Get my matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;
