# Pitfalls Research: Bidstand

## Common Pitfalls & Prevention Strategies

### 1. Floating-Point Currency Bugs
- **Pitfall**: Storing budget and bid amounts as floats leading to arithmetic discrepancies (e.g. ₹10.01 Lakhs becomes ₹10.009999).
- **Prevention**: Store all currency values as integers representing **Lakhs** (e.g., ₹100 Crore is stored as `10000`). Perform formatting only in the frontend display layer.

### 2. Client-Authoritative Timers
- **Pitfall**: Syncing/handling countdowns on client side leading to different tabs showing different timer values or deciding sold outcomes locally.
- **Prevention**: The Socket.io server is the sole authority for timers and outcomes. Clients only display countdowns based on `timerEndsAt` timestamps and react to server-pushed outcomes.

### 3. Bid Racing / Concurrency Issues
- **Pitfall**: Multiple teams bidding simultaneously resulting in overlapping bids or outdated bids being accepted.
- **Prevention**: Queue incoming bids and process them sequentially on the server. Reject bids if the current high bid has changed since client sent the bid request.

### 4. Connection Dropouts
- **Pitfall**: Team Owners losing connection mid-auction and losing their claimed team context.
- **Prevention**: Use HTTP cookies or localStorage to store the signed room JWT token. On reconnect, verify the JWT and re-establish the socket connection mapping to the correct room and team.
