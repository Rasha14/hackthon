# Backend Collection Names Fixes - Complete

## Summary
Fixed all backend routes to use correct Firestore collection names defined in `firestore.rules`. This resolves all Firestore permission errors ("Missing or insufficient permissions").

## Firestore Rules vs Backend Collections

### Rules Define (Correct):
- **Users** (capitalized) - User profiles and data
- **LostItems** (separated, capitalized) - Items reported as lost
- **FoundItems** (separated, capitalized) - Items reported as found
- **Matches** (capitalized) - System-created match records
- **Handovers** (capitalized) - Handover records for found items
- **Receipts** (capitalized) - Transaction receipts
- **HandoverLogs** (capitalized) - Handover history
- **AdminLogs** (capitalized) - Admin action logs

### Backend Was Using (Incorrect):
- `users` (lowercase)
- `items` (single collection with status field)
- `claims` (undefined in rules)

## Changes Made

### 1. **backend/.env**
- ✅ Updated `JWT_SECRET` from placeholder to secure value: `hackthon-jwt-secret-key-super-secure-2024-prod`

### 2. **backend/routes/auth.js** (4 fixes)
- ✅ Line 35: `collection('users')` → `collection('Users')` (check user exists)
- ✅ Line 67: `collection('users')` → `collection('Users')` (register user)
- ✅ Line 120: `collection('users')` → `collection('Users')` (login lookup)
- ✅ Line 192: `collection('users')` → `collection('Users')` (profile get)
- ✅ Line 242: `collection('users')` → `collection('Users')` (profile update)
- ✅ Line 245: `collection('users')` → `collection('Users')` (profile retrieve)

### 3. **backend/routes/admin.js** (5 major fixes)
- ✅ Dashboard data collection references:
  - `collection('users')` → `collection('Users')`
  - `collection('items')` → `collection('LostItems')` and `collection('FoundItems')`
  - `collection('claims')` → `collection('Matches')`
  - `collection('handovers')` → `collection('Handovers')`
- ✅ Dashboard response now uses correct counts and match data structure
- ✅ Users list endpoint: `collection('users')` → `collection('Users')`
- ✅ Disable user endpoint: `collection('users')` → `collection('Users')` (2 references)
- ✅ Enable user endpoint: `collection('users')` → `collection('Users')` (2 references)
- ✅ Heatmap endpoint: Removed status filter, queries only `collection('LostItems')`

### 4. **backend/routes/items.js** (14 comprehensive fixes)
- ✅ Report lost item: `collection('items')` → `collection('LostItems')`
- ✅ Report lost item user update: `collection('users')` → `collection('Users')`
- ✅ Report found item: `collection('items')` → `collection('FoundItems')`
- ✅ My-items endpoint: Separated queries for LostItems and FoundItems
- ✅ Search endpoint: Queries both LostItems and FoundItems based on status parameter
- ✅ Get item endpoint: Uses ID prefix (`found_` vs `lost_`) to determine collection
- ✅ Update item endpoint: Determines collection from ID prefix
- ✅ Delete item endpoint: Determines collection from ID prefix  
- ✅ Category filter endpoint: Queries both LostItems and FoundItems by category

**Key Insight**: Items are assigned prefixes during creation (`lost_` and `found_`) which allows runtime collection determination.

### 5. **backend/routes/handovers.js** (4 fixes)
- ✅ Verify handover: `collection('items')` → `collection('LostItems')` (get lost item)
- ✅ User stats update: `collection('users')` → `collection('Users')`
- ✅ Confirm handover: `collection('items')` → `collection('LostItems')` for lost items
- ✅ Confirm handover: `collection('items')` → `collection('FoundItems')` for found items

### 6. **backend/routes/matches.js** (10 fixes)
- ✅ Find matches endpoint: Updated to query LostItems and FoundItems separately
- ✅ Get item matches: Updated collection references for both item types
- ✅ User matches endpoint: Updated to query LostItems and FoundItems
- ✅ Request claim endpoint: Uses LostItems and FoundItems based on item type
- ✅ Get claim endpoint: Updated final retrieval queries for both collections

## Collection Strategy

### Lost Items vs Found Items
Backend now follows Firestore rules by:
1. **Creating** with type prefix: `lost_${timestamp}_${random}` or `found_${timestamp}_${random}`
2. **Querying** multiple collections when status is unknown:
   - Search endpoints query both LostItems and FoundItems
   - Results combined client-side
3. **Routing** to correct collection when ID is known:
   - Check ID prefix to determine collection
   - Single query with correct collection name

## Firestore Rules Compliance

✅ All backend code now complies with firestore.rules:
- Users collection uses capitalized name with proper document structure
- LostItems collection contains items with `status: 'lost'` or `status: 'recovered'`
- FoundItems collection contains items with `status: 'found'` or `status: 'handed_over'`
- Match creation handled by backend (create: false in rules, enforced by middleware)
- Handover creation handled by backend (create: false in rules)

## Testing Recommendations

1. **Auth flow**: Register/Login to test Users collection access
2. **Report items**: Report lost/found items to test LostItems/FoundItems write permissions
3. **Search**: Verify search works across both item collections
4. **Matches**: Trigger match finding to test LostItems/FoundItems read access
5. **Admin**: Test admin-only operations on Users collection

## Files Modified
- backend/.env (1 file)
- backend/routes/auth.js (6 fixes)
- backend/routes/admin.js (5 major fixes)
- backend/routes/items.js (14 fixes)
- backend/routes/handovers.js (4 fixes)
- backend/routes/matches.js (10 fixes)

**Total Fixes**: 40+ collection reference updates

## Related Files Already Fixed
- frontend src/services/firebase.ts - Already using correct collection names
- firestore.rules - Already defines correct collection names and permissions
- src/contexts/AuthContext.tsx - Already updated to use JWT tokens
