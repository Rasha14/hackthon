const { calculateMatchScore, findMatches } = require('./services/matchingService');

const lostItem = {
    id: 'lost1',
    itemName: 'Black Wallet',
    description: 'Black leather wallet with cards',
    category: 'wallet',
    location: 'Central Park',
    lostDate: '2024-02-01T10:00:00.000Z'
};

const foundItems = [
    {
        id: 'found1',
        itemName: 'Leather Wallet',
        description: 'Black wallet found on bench',
        category: 'wallet',
        foundLocation: 'Central Park',
        foundDate: '2024-02-01T12:00:00.000Z'
    },
    {
        id: 'found2',
        itemName: 'Red Umbrella',
        description: 'Large red umbrella',
        category: 'other',
        foundLocation: 'Subway Station',
        foundDate: '2024-02-02T09:00:00.000Z'
    }
];

console.log('--- Testing Matching Logic ---');
const score1 = calculateMatchScore(lostItem, foundItems[0]);
console.log(`Score for correct match: ${score1}`);

const score2 = calculateMatchScore(lostItem, foundItems[1]);
console.log(`Score for incorrect match: ${score2}`);

const matches = findMatches(lostItem, foundItems);
console.log('Matches found:', JSON.stringify(matches, null, 2));
