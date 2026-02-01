const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed!'), false);
    }
  }
});

/**
 * POST /api/items/report-lost
 * Report a lost item
 * Requires: authentication
 */
router.post('/report-lost', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      itemName,
      category,
      description,
      location,
      lostDate,
      lostTime,
      imageUrl,
      color,
      brand,
      estimatedValue
    } = req.body;

    // Validate required fields
    if (!itemName || !category || !description || !location) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Item name, category, description, and location are required'
      });
    }

    // Create lost item document
    const itemId = `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const itemData = {
      id: itemId,
      userId,
      itemName,
      category,
      description,
      location,
      lostDate,
      lostTime,
      imageUrl: imageUrl || null,
      color: color || '',
      brand: brand || '',
      estimatedValue: estimatedValue || 0,
      status: 'lost',
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      matches: []
    };

    // Save to Firestore
    await req.db.collection('LostItems').doc(itemId).set(itemData);

    // Update user stats
    const userDoc = await req.db.collection('Users').doc(userId).get();
    await req.db.collection('Users').doc(userId).update({
      itemsReported: (userDoc.data().itemsReported || 0) + 1
    });

    res.status(201).json({
      message: 'Lost item reported successfully',
      item: itemData
    });
  } catch (error) {
    console.error('Report lost item error:', error);
    res.status(500).json({
      error: 'Report Failed',
      message: error.message
    });
  }
});

/**
 * POST /api/items/report-found
 * Report a found item
 * Requires: authentication
 */
router.post('/report-found', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      itemName,
      category,
      description,
      foundLocation,
      foundDate,
      foundTime,
      imageUrl,
      color,
      brand,
      currentLocation
    } = req.body;

    // Validate required fields
    if (!itemName || !category || !description || !foundLocation) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Item name, category, description, and found location are required'
      });
    }

    // Create found item document
    const itemId = `found_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const itemData = {
      id: itemId,
      userId,
      itemName,
      category,
      description,
      foundLocation,
      foundDate,
      foundTime,
      imageUrl: imageUrl || null,
      color: color || '',
      brand: brand || '',
      currentLocation: currentLocation || foundLocation,
      status: 'found',
      claimRequests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      matches: []
    };

    // Save to Firestore
    await req.db.collection('FoundItems').doc(itemId).set(itemData);

    res.status(201).json({
      message: 'Found item reported successfully',
      item: itemData
    });
  } catch (error) {
    console.error('Report found item error:', error);
    res.status(500).json({
      error: 'Report Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/items/my-items
 * Get all items reported by current user
 * Requires: authentication
 */
router.get('/my-items', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { type } = req.query; // 'lost' or 'found' or both

    let allItems = [];

    // Query LostItems if not explicitly 'found' only
    if (!type || type === 'lost') {
      const lostSnapshot = await req.db.collection('LostItems')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      allItems.push(...lostSnapshot.docs.map(doc => doc.data()));
    }

    // Query FoundItems if not explicitly 'lost' only
    if (!type || type === 'found') {
      const foundSnapshot = await req.db.collection('FoundItems')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      allItems.push(...foundSnapshot.docs.map(doc => doc.data()));
    }

    // Sort combined results by createdAt
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      items: allItems,
      count: allItems.length
    });
  } catch (error) {
    console.error('Fetch user items error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/items/search
 * Search for items
 * Query parameters: q (search query), category, status
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, status } = req.query;

    let allItems = [];

    // Determine which collection(s) to search
    const shouldSearchLost = !status || status === 'lost';
    const shouldSearchFound = !status || status === 'found';

    if (shouldSearchLost) {
      let query = req.db.collection('LostItems');
      if (category) {
        query = query.where('category', '==', category);
      }
      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      allItems.push(...snapshot.docs.map(doc => doc.data()));
    }

    if (shouldSearchFound) {
      let query = req.db.collection('FoundItems');
      if (category) {
        query = query.where('category', '==', category);
      }
      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      allItems.push(...snapshot.docs.map(doc => doc.data()));
    }

    // Client-side text search if query provided
    if (q) {
      const lowerQ = q.toLowerCase();
      allItems = allItems.filter(item =>
        item.itemName.toLowerCase().includes(lowerQ) ||
        item.description.toLowerCase().includes(lowerQ) ||
        item.category.toLowerCase().includes(lowerQ)
      );
    }

    // Limit results and sort by date
    allItems = allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);

    res.json({
      items: allItems,
      count: allItems.length
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({
      error: 'Search Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/items/:itemId
 * Get single item details
 */
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    // Determine collection based on item ID prefix
    const collection = itemId.startsWith('found_') ? 'FoundItems' : 'LostItems';
    const itemDoc = await req.db.collection(collection).doc(itemId).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }

    const itemData = itemDoc.data();

    // Increment views
    await req.db.collection(collection).doc(itemId).update({
      views: (itemData.views || 0) + 1
    });

    res.json({
      item: itemData
    });
  } catch (error) {
    console.error('Fetch item error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

/**
 * PUT /api/items/:itemId
 * Update an item (only by owner or admin)
 * Requires: authentication
 */
router.put('/:itemId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.params;
    const { itemName, description, status, currentLocation } = req.body;

    // Determine collection based on item ID prefix
    const collection = itemId.startsWith('found_') ? 'FoundItems' : 'LostItems';

    // Get item
    const itemDoc = await req.db.collection(collection).doc(itemId).get();
    if (!itemDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }

    const itemData = itemDoc.data();

    // Check authorization (only item owner can update)
    if (itemData.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own items'
      });
    }

    // Build update data
    const updateData = { updatedAt: new Date().toISOString() };
    if (itemName) updateData.itemName = itemName;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (currentLocation) updateData.currentLocation = currentLocation;

    // Update item
    await req.db.collection(collection).doc(itemId).update(updateData);

    // Get updated item
    const updatedDoc = await req.db.collection(collection).doc(itemId).get();

    res.json({
      message: 'Item updated successfully',
      item: updatedDoc.data()
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      error: 'Update Failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/items/:itemId
 * Delete an item (only by owner or admin)
 * Requires: authentication
 */
router.delete('/:itemId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemId } = req.params;

    // Determine collection based on item ID prefix
    const collection = itemId.startsWith('found_') ? 'FoundItems' : 'LostItems';

    // Get item
    const itemDoc = await req.db.collection(collection).doc(itemId).get();
    if (!itemDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Item not found'
      });
    }

    const itemData = itemDoc.data();

    // Check authorization
    if (itemData.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own items'
      });
    }

    // Delete item
    await req.db.collection(collection).doc(itemId).delete();

    res.json({
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      error: 'Delete Failed',
      message: error.message
    });
  }
});

/**
 * GET /api/items/category/:category
 * Get all items in a specific category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    let allItems = [];

    // Search both LostItems and FoundItems
    const lostSnapshot = await req.db
      .collection('LostItems')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const foundSnapshot = await req.db
      .collection('FoundItems')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    allItems.push(...lostSnapshot.docs.map(doc => doc.data()));
    allItems.push(...foundSnapshot.docs.map(doc => doc.data()));

    // Sort by date and limit
    allItems = allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);

    res.json({
      items: allItems,
      count: allItems.length,
      category
    });
  } catch (error) {
    console.error('Fetch by category error:', error);
    res.status(500).json({
      error: 'Fetch Failed',
      message: error.message
    });
  }
});

module.exports = router;