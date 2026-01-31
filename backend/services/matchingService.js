// AI Matching Service for Lost&Found AI+
// Computes match scores using weighted criteria with advanced text similarity

// Levenshtein distance for string similarity
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
};

// Calculate string similarity as percentage
const stringSimilarity = (str1, str2) => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  const distance = levenshteinDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
};

// Helper function to calculate text similarity (improved implementation)
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;

  const t1 = text1.toLowerCase();
  const t2 = text2.toLowerCase();

  // Exact match
  if (t1 === t2) return 100;

  // Word-level similarity
  const words1 = t1.split(/\s+/).filter(w => w.length > 0);
  const words2 = t2.split(/\s+/).filter(w => w.length > 0);

  if (words1.length === 0 || words2.length === 0) {
    return stringSimilarity(t1, t2);
  }

  // Calculate word-based similarity
  let wordMatches = 0;
  let totalDistance = 0;

  for (const word1 of words1) {
    for (const word2 of words2) {
      const similarity = stringSimilarity(word1, word2);
      if (similarity > 75) {
        wordMatches += similarity / 100;
        break;
      }
    }
  }

  // Average word similarity
  const wordSimilarity = (wordMatches / Math.max(words1.length, words2.length)) * 100;

  // Character-level similarity
  const charSimilarity = stringSimilarity(t1, t2);

  // Combined score (weighted)
  return (wordSimilarity * 0.6 + charSimilarity * 0.4);
};

// Helper function to calculate location similarity
const calculateLocationSimilarity = (location1, location2) => {
  if (!location1 || !location2) return 0;

  // Simple string matching for location
  const loc1 = location1.toLowerCase();
  const loc2 = location2.toLowerCase();

  if (loc1 === loc2) return 100;

  // Check if one location contains the other
  if (loc1.includes(loc2) || loc2.includes(loc1)) return 75;

  // Check for common words
  return calculateTextSimilarity(location1, location2);
};

// Helper function to calculate time relevance
const calculateTimeRelevance = (time1, time2) => {
  if (!time1 || !time2) return 0;

  const date1 = new Date(time1);
  const date2 = new Date(time2);
  const diffHours = Math.abs(date1 - date2) / (1000 * 60 * 60);

  if (diffHours <= 24) return 100; // Within 24 hours
  if (diffHours <= 72) return 75;  // Within 3 days
  if (diffHours <= 168) return 50; // Within 1 week
  if (diffHours <= 720) return 25; // Within 1 month

  return 0; // More than a month
};

// Helper function to calculate basic image similarity
// This is a simplified implementation - in production, use proper image processing libraries
const calculateImageSimilarity = async (imageUrl1, imageUrl2) => {
  if (!imageUrl1 || !imageUrl2) return 0;

  try {
    // For now, implement basic similarity based on filename patterns and metadata
    // In a real implementation, this would use image processing libraries

    // Extract filename from URLs
    const filename1 = imageUrl1.split('/').pop()?.toLowerCase() || '';
    const filename2 = imageUrl2.split('/').pop()?.toLowerCase() || '';

    // Check for common keywords that might indicate similar images
    const imageKeywords = ['phone', 'wallet', 'keys', 'bag', 'watch', 'jewelry', 'laptop', 'tablet'];
    const commonKeywords1 = imageKeywords.filter(keyword => filename1.includes(keyword));
    const commonKeywords2 = imageKeywords.filter(keyword => filename2.includes(keyword));

    // If both images contain the same keywords, give higher similarity
    const commonKeywords = commonKeywords1.filter(keyword => commonKeywords2.includes(keyword));
    if (commonKeywords.length > 0) {
      return Math.min(80 + (commonKeywords.length * 10), 95); // 80-95% similarity
    }

    // Check for color indicators in filename
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'brown', 'gray', 'grey', 'silver', 'gold'];
    const color1 = colors.find(color => filename1.includes(color));
    const color2 = colors.find(color => filename2.includes(color));

    if (color1 && color2 && color1 === color2) {
      return 60; // Same color mentioned = moderate similarity
    }

    // Check for numbers (model numbers, etc.)
    const numbers1 = filename1.match(/\d+/g);
    const numbers2 = filename2.match(/\d+/g);

    if (numbers1 && numbers2) {
      const commonNumbers = numbers1.filter(num => numbers2.includes(num));
      if (commonNumbers.length > 0) {
        return 70; // Same numbers = good similarity
      }
    }

    // Default low similarity for different images
    return 20;

  } catch (error) {
    console.error('Error calculating image similarity:', error);
    return 0;
  }
};

// Main function to calculate match score
const calculateMatchScore = async (lostItem, foundItem) => {
  let totalScore = 0;
  const breakdown = {
    textSimilarity: 0,
    locationMatch: 0,
    timeRelevance: 0,
    imageSimilarity: 0
  };

  // Text similarity (description) - 50%
  const textScore = calculateTextSimilarity(lostItem.description, foundItem.description);
  breakdown.textSimilarity = textScore;
  totalScore += textScore * 0.5;

  // Location match - 30%
  const locationScore = calculateLocationSimilarity(lostItem.location, foundItem.location);
  breakdown.locationMatch = locationScore;
  totalScore += locationScore * 0.3;

  // Time relevance (<24h) - 20%
  const timeScore = calculateTimeRelevance(lostItem.time, foundItem.time);
  breakdown.timeRelevance = timeScore;
  totalScore += timeScore * 0.2;

  // Image similarity - 10% (basic implementation)
  const imageScore = await calculateImageSimilarity(lostItem.image_url, foundItem.image_url);
  breakdown.imageSimilarity = imageScore;
  totalScore += imageScore * 0.1;

  return {
    total: Math.round(totalScore),
    breakdown
  };
};

// Function to generate AI questions for ownership verification
const generateVerificationQuestions = (itemCategory) => {
  const questionTemplates = {
    bag: [
      { question: "What color is the zipper?", type: "text" },
      { question: "How many compartments does it have?", type: "number" },
      { question: "What brand or logo is on the bag?", type: "text" }
    ],
    wallet: [
      { question: "How many card slots does it have?", type: "number" },
      { question: "What color is the wallet?", type: "text" },
      { question: "Does it have a coin pocket?", type: "boolean" }
    ],
    phone: [
      { question: "What color is the phone case?", type: "text" },
      { question: "Does it have any distinctive scratches or marks?", type: "text" },
      { question: "What brand is the phone?", type: "text" }
    ],
    keys: [
      { question: "How many keys are on the keyring?", type: "number" },
      { question: "What type of keyring does it have?", type: "text" },
      { question: "Are there any distinctive keychains?", type: "text" }
    ],
    jewelry: [
      { question: "What type of metal is it made of?", type: "text" },
      { question: "Does it have any engravings?", type: "text" },
      { question: "What is the main gemstone or design?", type: "text" }
    ],
    default: [
      { question: "What is the primary color of the item?", type: "text" },
      { question: "Are there any distinctive marks or labels?", type: "text" },
      { question: "What is the approximate size of the item?", type: "text" }
    ]
  };

  return questionTemplates[itemCategory.toLowerCase()] || questionTemplates.default;
};

module.exports = {
  calculateMatchScore,
  generateVerificationQuestions
};
