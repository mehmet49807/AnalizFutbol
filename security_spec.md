# Security Specification for GOL App

## Data Invariants
1. A user can only read and write their own profile data (except for points/tokens which might need server-side logic, but for now we'll allow client-side for the demo, or strict checks). Actually, tokens and points should probably be updated via a "reward" function, but I'll implement them with strict field-level rules for now.
2. Predictions must be linked to the authenticated user's ID.
3. Users cannot modify matches; matches are read-only for users (system-generated).
4. Users can only create predictions for matches that are "upcoming".

## The "Dirty Dozen" Payloads
1. Attempt to create a user profile with `userId` of another user.
2. Attempt to update another user's tokens.
3. Attempt to increase own tokens by 1 million.
4. Attempt to create a prediction for another user.
5. Attempt to create a prediction for a match that already started/finished.
6. Attempt to update a prediction result after the match is finished.
7. Attempt to delete a match document.
8. Attempt to update a match's `result`.
9. Attempt to read all predictions of another user.
10. Attempt to inject a 1MB string into a `name` field.
11. Attempt to create a prediction without a valid `matchId`.
12. Attempt to spoof `email_verified` as false but access admin-only fields (if any).

## Rule Strategy
- Users: `allow read, update: if isOwner(userId)`. Updates restricted to specific fields.
- Matches: `allow list, get: if isSignedIn()`. `allow write: if false`.
- Predictions: `allow create: if isSignedIn() && incoming().userId == request.auth.uid`. `allow list, get: if isOwner(resource.data.userId)`.
