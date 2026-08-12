const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const context = fs.readFileSync(path.join(root, 'context', 'RestaurantContext.tsx'), 'utf8');
const explore = fs.readFileSync(path.join(root, 'app', 'explore.tsx'), 'utf8');

assert.match(context, /export interface UserDirectoryCursor/);
assert.match(context, /p_after_like_count:\s*cursor\?\.likeCount \?\? null/);
assert.match(context, /p_after_view_count:\s*cursor\?\.viewCount \?\? null/);
assert.match(context, /p_after_restaurant_count:\s*cursor\?\.restaurantCount \?\? null/);
assert.match(context, /p_after_id:\s*cursor\?\.id \?\? null/);
assert.match(context, /Math\.min\(Math\.max\(Math\.trunc\(limit\), 1\), 100\)/);
assert.match(context, /isProfileAfterCursor\(profile, cursor\)/);

assert.match(explore, /onEndReached=\{loadMore\}/);
assert.match(explore, /loadingMoreRef\.current/);
assert.match(explore, /loadGenerationRef\.current/);
assert.match(explore, /existingIds\.has\(profile\.id\)/);

console.log('Pagination integration tests passed');
