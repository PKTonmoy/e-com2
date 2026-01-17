/**
 * Keep-Alive Mechanism for Render Free Tier
 * 
 * This module prevents Render from putting the service to sleep after 15 minutes
 * of inactivity by performing lightweight internal operations at regular intervals.
 * 
 * Why this works:
 * - Render monitors the Node.js event loop for activity
 * - A running setInterval keeps the event loop active
 * - No external HTTP requests needed - purely internal operation
 * - Minimal resource footprint (just updating an in-memory timestamp)
 */

// In-memory heartbeat state
let lastHeartbeat = null;
let heartbeatCount = 0;
let intervalId = null;

/**
 * Performs a lightweight internal heartbeat operation.
 * This keeps the Node.js event loop active without making network requests.
 */
const performHeartbeat = () => {
    try {
        lastHeartbeat = new Date();
        heartbeatCount++;

        // Log every heartbeat with useful info for monitoring in Render logs
        console.log(
            `[KeepAlive] ❤️ Heartbeat #${heartbeatCount} at ${lastHeartbeat.toISOString()} | ` +
            `Uptime: ${Math.floor(process.uptime() / 60)} mins | ` +
            `Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        );
    } catch (err) {
        // Heartbeat should never crash the main app
        console.error('[KeepAlive] ⚠️ Heartbeat error:', err.message);
    }
};

/**
 * Starts the keep-alive mechanism.
 * Only runs in production environment to avoid unnecessary noise during development.
 * 
 * @param {number} port - The server port (used for logging purposes only)
 * @param {number} intervalMinutes - Interval between heartbeats in minutes (default: 5)
 */
const startSelfPing = (port, intervalMinutes = 5) => {
    // Only run in production environment
    if (process.env.NODE_ENV !== 'production') {
        console.log('[KeepAlive] ⏸️ Skipped - Not in production environment');
        return;
    }

    // Prevent multiple intervals from being created
    if (intervalId) {
        console.warn('[KeepAlive] ⚠️ Already running, skipping duplicate start');
        return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   🚀 KEEP-ALIVE ACTIVATED                       ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Interval: Every ${intervalMinutes} minutes                                      ║`);
    console.log(`║  Port: ${port}                                                      ║`);
    console.log(`║  Purpose: Prevent Render free tier sleep                        ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');

    // Perform initial heartbeat immediately
    performHeartbeat();

    // Schedule subsequent heartbeats
    // Using 5 minutes provides a good safety margin against Render's 15-minute threshold
    // while not being too resource-intensive
    intervalId = setInterval(performHeartbeat, intervalMs);

    // Make the interval non-blocking for graceful shutdown
    intervalId.unref();
};

/**
 * Stops the keep-alive mechanism.
 * Useful for testing or graceful shutdown scenarios.
 */
const stopSelfPing = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[KeepAlive] ⏹️ Stopped');
    }
};

/**
 * Gets the current heartbeat status.
 * Useful for health checks or debugging.
 */
const getHeartbeatStatus = () => ({
    lastHeartbeat,
    heartbeatCount,
    isRunning: intervalId !== null,
    uptimeMinutes: Math.floor(process.uptime() / 60),
});

export default startSelfPing;
export { startSelfPing, stopSelfPing, getHeartbeatStatus };
