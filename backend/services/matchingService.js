/**
 * Matching Service
 * Provides AI-based matching algorithms for lost and found items
 */

/**
 * Calculate Levenshtein distance (character-level similarity)
 * Returns similarity score between 0 and 1
 */
const calculateLevenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - (matrix[len2][len1] / maxLen);
};

/**
 * Calculate word-level similarity
 * Checks if words in str1 are present in str2
 */
const calculateWordSimilarity = (str1, str2) => {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      const similarity = calculateLevenshteinDistance(word1, word2);
      if (similarity > 0.8) {
        matches++;
        break;
      }
    }
  }

  return matches / words1.length;
};

/**
 * Calculate text similarity between descriptions
 * Combines word-level and character-level matching
 */
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const charSimilarity = calculateLevenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
  const wordSimilarity = calculateWordSimilarity(text1, text2);

  // Weighted average: 40% character similarity, 60% word similarity
  return charSimilarity * 0.4 + wordSimilarity * 0.6;
};

/**
 * Calculate location similarity
 * Based on string matching (exact or partial match)
 */
const calculateLocationSimilarity = (loc1, loc2) => {
  if (!loc1 || !loc2) return 0;

  const l1 = loc1.toLowerCase();
  const l2 = loc2.toLowerCase();

  // Exact match
  if (l1 === l2) return 1.0;

  // Partial match (one contains the other)
  if (l1.includes(l2) || l2.includes(l1)) return 0.85;

  // Word-level matching
  const words1 = l1.split(/[\s,/]+/).filter(w => w.length > 2);
  const words2 = l2.split(/[\s,/]+/).filter(w => w.length > 2);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word1 === word2 || calculateLevenshteinDistance(word1, word2) > 0.8)) {
      matches++;
    }
  }

  return Math.min(matches / Math.max(words1.length, words2.length), 0.8);
};

/**
 * Calculate time relevance
 * Items lost/found closer in time are more likely to match
 */
const calculateTimeRelevance = (time1, time2) => {
  if (!time1 || !time2) return 0;

  const date1 = new Date(time1);
  const date2 = new Date(time2);

  if (isNaN(date1) || isNaN(date2)) return 0;

  const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return 1.0; // Same day
  if (daysDiff <= 1) return 0.95; // Within 1 day
  if (daysDiff <= 3) return 0.85; // Within 3 days
  if (daysDiff <= 7) return 0.70; // Within a week
  if (daysDiff <= 14) return 0.50; // Within 2 weeks
  if (daysDiff <= 30) return 0.30; // Within a month

  return 0.1; // More than a month
};

/**
 * Calculate category similarity
 * Exact category matches score high
 */
const calculateCategorySimilarity = (cat1, cat2) => {
  if (!cat1 || !cat2) return 0;
  return cat1.toLowerCase() === cat2.toLowerCase() ? 1.0 : 0;
};

/**
 * Calculate overall match score between two items
 * Returns score 0-100
 */
const calculateMatchScore = (lostItem, foundItem) => {
  if (!lostItem || !foundItem) return 0;

  const scores = {
    // Text similarity: description match (35%)
    text: calculateTextSimilarity(
      `${lostItem.itemName} ${lostItem.description}`,
      `${foundItem.itemName} ${foundItem.description}`
    ) * 35,

    // Category similarity: exact match (25%)
    category: calculateCategorySimilarity(lostItem.category, foundItem.category) * 25,

    // Location similarity: where lost/found (20%)
    location: calculateLocationSimilarity(
      lostItem.location || lostItem.lostDate,
      foundItem.foundLocation || foundItem.foundDate
    ) * 20,

    // Time relevance: when lost/found (20%)
    time: calculateTimeRelevance(lostItem.lostDate, foundItem.foundDate) * 20
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  return Math.min(100, Math.round(totalScore));
};

/**
 * Get confidence level based on match score
 */
const getConfidenceLevel = (score) => {
  if (score >= 80) return { level: 'High', color: 'green', emoji: '🔥' };
  if (score >= 50) return { level: 'Medium', color: 'orange', emoji: '⚡' };
  return { level: 'Low', color: 'red', emoji: '❄️' };
};

/**
 * Generate AI verification questions based on item category
 */
const generateVerificationQuestions = (category) => {
  const questionSets = {
    phone: [
      'What color is your phone?',
      'What brand/model is it?',
      'Describe any visible scratches or damage',
      'What is your lock screen wallpaper?'
    ],
    laptop: [
      'What is the screen size of your laptop?',
      'What brand is it?',
      'Describe any distinguishing marks or stickers',
      'What operating system does it run?'
    ],
    bag: [
      'What color and material is the bag?',
      'Describe any items that were inside',
      'What brand is it?',
      'Describe any damage or wear'
    ],
    wallet: [
      'What color is your wallet?',
      'Describe its material and design',
      'Name any cards that were inside',
      'What brand is it?'
    ],
    watch: [
      'What color is the watch?',
      'What brand and model?',
      'Describe the watch face shape',
      'What type of band does it have?'
    ],
    keys: [
      'Describe your key ring',
      'How many keys are on it?',
      'Are there any distinctive markers or tags?',
      'Describe the keychain'
    ],
    glasses: [
      'What color are the frames?',
      'What brand are they?',
      'Describe any distinctive features',
      'Are they prescription or sunglasses?'
    ],
    jewelry: [
      'Describe the type of jewelry',
      'What metal is it made of?',
      'Are there any gemstones or engravings?',
      'Describe any distinctive features'
    ],
    document: [
      'What type of document is it?',
      'What is your full name on the document?',
      'What is the document ID number?',
      'What is the expiry or issue date?'
    ],
    other: [
      'Describe the item in detail',
      'What is the brand or manufacturer?',
      'Describe any unique features or damage',
      'What condition was it in?'
    ]
  };

  const normalized = category.toLowerCase().trim();
  return questionSets[normalized] || questionSets.other;
};

/**
 * Find matches for a lost item
 * Returns top 3 matches with scores and confidence levels
 */
const findMatches = (lostItem, foundItems) => {
  if (!Array.isArray(foundItems) || foundItems.length === 0) {
    return [];
  }

  const matches = foundItems
    .filter(foundItem => foundItem.id !== lostItem.id)
    .map(foundItem => {
      const score = calculateMatchScore(lostItem, foundItem);
      const confidence = getConfidenceLevel(score);

      return {
        foundItem,
        score,
        confidence,
        explanation: generateMatchExplanation(lostItem, foundItem, score)
      };
    })
    .filter(match => match.score >= 30) // Only return matches with score >= 30
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Return top 3

  return matches;
};

/**
 * Generate explanation for why items match
 */
const generateMatchExplanation = (lostItem, foundItem, score) => {
  const reasons = [];

  // Text similarity
  const textSim = calculateTextSimilarity(
    `${lostItem.itemName} ${lostItem.description}`,
    `${foundItem.itemName} ${foundItem.description}`
  );
  if (textSim > 0.7) reasons.push('Description matches well');

  // Category
  if (calculateCategorySimilarity(lostItem.category, foundItem.category) > 0.5) {
    reasons.push('Same category');
  }

  // Location
  const locSim = calculateLocationSimilarity(
    lostItem.location || lostItem.lostDate,
    foundItem.foundLocation || foundItem.foundDate
  );
  if (locSim > 0.7) reasons.push('Same or nearby location');

  // Time
  const timeSim = calculateTimeRelevance(lostItem.lostDate, foundItem.foundDate);
  if (timeSim > 0.7) reasons.push('Found shortly after loss');

  if (reasons.length === 0) {
    reasons.push('Potential match based on overall characteristics');
  }

  return reasons.join(', ');
};

module.exports = {
  calculateMatchScore,
  calculateTextSimilarity,
  calculateLocationSimilarity,
  calculateTimeRelevance,
  calculateCategorySimilarity,
  getConfidenceLevel,
  generateVerificationQuestions,
  findMatches,
  generateMatchExplanation,
  calculateLevenshteinDistance,
  calculateWordSimilarity
};
