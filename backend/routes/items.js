const express = require('express');
const admin = require('firebase-admin');
const { verifyToken } = require('../middleware/auth');
const { upload } = require('../server');
const { generateVerificationQuestions } = require('../services/matchingService');

const router = express.Router();
const db = admin.firestore();
const bucket = admin.storage().bucket();

// Helper function to upload image to Firebase Storage
const uploadImage = async (file, itemId) => {
  if (!file) return null;

  const fileName = `items/${itemId}/${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      // Make the file publicly accessible
      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });
    stream.end(file.buffer);
  });
};

// Report lost item
router.post('/report-lost', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, location, time } = req.body;

    if (!name || !category || !description || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const itemData = {
      name,
      category,
      description,
      location,
      time: time || new Date().toISOString(),
      user_id: req.user.uid,
      status: 'lost',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      verification_answers: req.body.verification_answers || [] // For ownership verification
    };

    // Upload image if provided
    if (req.file) {
      const itemRef = await db.collection('LostItems').add(itemData);
      const imageUrl = await uploadImage(req.file, itemRef.id);
      await itemRef.update({ image_url: imageUrl });
      itemData.id = itemRef.id;
      itemData.image_url = imageUrl;
    } else {
      const itemRef = await db.collection('LostItems').add(itemData);
      itemData.id = itemRef.id;
    }

    res.status(201).json({
      message: 'Lost item reported successfully',
      item: itemData
    });
  } catch (error) {
    console.error('Report lost item error:', error);
    res.status(500).json({ error: 'Failed to report lost item' });
  }
});

// Report found item
router.post('/report-found', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, description, location, time } = req.body;

    if (!name || !category || !description || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const itemData = {
      name,
      category,
      description,
      location,
      time: time || new Date().toISOString(),
      finder_id: req.user.uid,
      status: 'found',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Upload image if provided
    if (req.file) {
      const itemRef = await db.collection('FoundItems').add(itemData);
      const imageUrl = await uploadImage(req.file, itemRef.id);
      await itemRef.update({ image_url: imageUrl });
      itemData.id = itemRef.id;
      itemData.image_url = imageUrl;
    } else {
      const itemRef = await db.collection('FoundItems').add(itemData);
      itemData.id = itemRef.id;
    }

    res.status(201).json({
      message: 'Found item reported successfully',
      item: itemData
    });
  } catch (error) {
    console.error('Report found item error:', error);
    res.status(500).json({ error: 'Failed to report found item' });
  }
});

// Get user's lost items
router.get('/my-lost-items', verifyToken, async (req, res) => {
  try {
    const lostItemsSnapshot = await db.collection('LostItems')
      .where('user_id', '==', req.user.uid)
      .orderBy('created_at', 'desc')
      .get();

    const lostItems = [];
    lostItemsSnapshot.forEach(doc => {
      lostItems.push({ id: doc.id, ...doc.data() });
    });

    res.json({ lostItems });
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({ error: 'Failed to fetch lost items' });
  }
});

// Get user's found items
router.get('/my-found-items', verifyToken, async (req, res) => {
  try {
    const foundItemsSnapshot = await db.collection('FoundItems')
      .where('finder_id', '==', req.user.uid)
      .orderBy('created_at', 'desc')
      .get();

    const foundItems = [];
    foundItemsSnapshot.forEach(doc => {
      foundItems.push({ id: doc.id, ...doc.data() });
    });

    res.json({ foundItems });
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({ error: 'Failed to fetch found items' });
  }
});

// Get verification questions for a category
router.get('/verification-questions/:category', verifyToken, async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const questions = generateVerificationQuestions(category);

    res.json({
      category,
      questions,
      instruction: 'Please answer these questions accurately to verify item ownership.'
    });
  } catch (error) {
    console.error('Get verification questions error:', error);
    res.status(500).json({ error: 'Failed to fetch verification questions' });
  }
});

// Update item with verification answers
router.put('/:itemId/verification-answers', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required' });
    }

    const itemRef = db.collection('LostItems').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = itemDoc.data();

    // Check ownership
    if (item.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update with verification answers
    await itemRef.update({
      verification_answers: answers,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      message: 'Verification answers updated successfully',
      item_id: itemId
    });
  } catch (error) {
    console.error('Update verification answers error:', error);
    res.status(500).json({ error: 'Failed to update verification answers' });
  }
});

module.exports = router;
