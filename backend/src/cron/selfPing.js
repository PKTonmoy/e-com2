/**
 * Advanced Keep-Alive System for Render Free Tier
 * 
 * This module prevents Render from putting the service to sleep after 15 minutes
 * of inactivity by making actual HTTP requests to the server's own /health endpoint.
 * 
 * How it works:
 * - Interval: Every 14 minutes (KEEP_ALIVE_INTERVAL = 14 * 60 * 1000)
 * - Method: Uses native http/https module to send a GET request to /health endpoint
 * - Logic: Auto-detects the server URL using RENDER_EXTERNAL_URL environment variable
 *         If running on Render, it starts the loop; otherwise stays quiet (local dev)
 * - Startup: Initialized when the Express server starts listening
 */

import http from 'http';
import https from 'https';

// Configuration
const KEEP_ALIVE_INTERVAL_MINUTES = 14; // 14 minutes (safe margin under 15-min sleep threshold)
const KEEP_ALIVE_INTERVAL_MS = KEEP_ALIVE_INTERVAL_MINUTES * 60 * 1000;
const PING_TIMEOUT_MS = 30000; // 30 seconds timeout for each ping
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

// Keep-alive state
let intervalId = null;
let isRunning = false;
const stats = {
    totalPings: 0,
    successfulPings: 0,
    failedPings: 0,
    lastPingTime: null,
    lastPingStatus: null,
    lastPingDurationMs: null,
    lastError: null,
    startTime: null,
    consecutiveFailures: 0,
};

/**
 * Makes an HTTP GET request to the specified URL
 * @param {string} url - The URL to ping
 * @returns {Promise<{success: boolean, statusCode: number, durationMs: number, error?: string}>}
 */
const pingUrl = (url) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.get(url, { timeout: PING_TIMEOUT_MS }, (res) => {
            const durationMs = Date.now() - startTime;

            // Consume response data to free up memory
            res.resume();

            resolve({
                success: res.statusCode >= 200 && res.statusCode < 400,
                statusCode: res.statusCode,
                durationMs,
            });
        });

        req.on('error', (err) => {
            const durationMs = Date.now() - startTime;
            resolve({
                success: false,
                statusCode: 0,
                durationMs,
                error: err.message,
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const durationMs = Date.now() - startTime;
            resolve({
                success: false,
                statusCode: 0,
                durationMs,
                error: 'Request timeout',
            });
        });
    });
};

/**
 * Pings the health endpoint with retry logic
 * @param {string} healthUrl - The health check URL
 * @returns {Promise<{success: boolean, attempts: number, finalResult: object}>}
 */
const pingWithRetry = async (healthUrl) => {
    let attempts = 0;
    let lastResult = null;

    while (attempts < MAX_RETRIES) {
        attempts++;
        lastResult = await pingUrl(healthUrl);

        if (lastResult.success) {
            return { success: true, attempts, finalResult: lastResult };
        }

        if (attempts < MAX_RETRIES) {
            console.log(`[KeepAlive] ⚠️ Ping attempt ${attempts} failed, retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }

    return { success: false, attempts, finalResult: lastResult };
};

/**
 * Performs the keep-alive ping
 * @param {string} healthUrl - The health check URL
 */
const performKeepAlivePing = async (healthUrl) => {
    stats.totalPings++;
    const pingNumber = stats.totalPings;

    console.log(`[KeepAlive] 🔄 Ping #${pingNumber} starting...`);

    const result = await pingWithRetry(healthUrl);
    const now = new Date();

    stats.lastPingTime = now;
    stats.lastPingDurationMs = result.finalResult.durationMs;
    stats.lastPingStatus = result.finalResult.statusCode;

    if (result.success) {
        stats.successfulPings++;
        stats.consecutiveFailures = 0;
        stats.lastError = null;

        const uptimeMinutes = Math.floor((now - stats.startTime) / 60000);
        const successRate = ((stats.successfulPings / stats.totalPings) * 100).toFixed(1);

        console.log(
            `[KeepAlive] ✅ Ping #${pingNumber} SUCCESS | ` +
            `Status: ${result.finalResult.statusCode} | ` +
            `Time: ${result.finalResult.durationMs}ms | ` +
            `Uptime: ${uptimeMinutes} mins | ` +
            `Success Rate: ${successRate}% (${stats.successfulPings}/${stats.totalPings})`
        );
    } else {
        stats.failedPings++;
        stats.consecutiveFailures++;
        stats.lastError = result.finalResult.error || `HTTP ${result.finalResult.statusCode}`;

        console.error(
            `[KeepAlive] ❌ Ping #${pingNumber} FAILED after ${result.attempts} attempts | ` +
            `Error: ${stats.lastError} | ` +
            `Consecutive failures: ${stats.consecutiveFailures}`
        );

        // Log warning if too many consecutive failures
        if (stats.consecutiveFailures >= 3) {
            console.error(
                `[KeepAlive] 🚨 WARNING: ${stats.consecutiveFailures} consecutive failures! ` +
                `Server may be having issues.`
            );
        }
    }
};

/**
 * Starts the advanced keep-alive mechanism
 * @param {number} port - The server port (used for local URL construction)
 */
const startSelfPing = (port) => {
    // Get the Render external URL (automatically set by Render)
    const renderUrl = process.env.RENDER_EXTERNAL_URL;

    // Only run if we have a Render URL (i.e., we're deployed on Render)
    if (!renderUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.log('[KeepAlive] ⚠️ RENDER_EXTERNAL_URL not set - keep-alive disabled');
            console.log('[KeepAlive] 💡 Tip: Set RENDER_EXTERNAL_URL to your service URL to enable keep-alive');
        } else {
            console.log('[KeepAlive] ⏸️ Skipped - Not running on Render (development mode)');
        }
        return;
    }

    // Prevent multiple intervals
    if (isRunning) {
        console.warn('[KeepAlive] ⚠️ Already running, skipping duplicate start');
        return;
    }

    const healthUrl = `${renderUrl}/health`;
    stats.startTime = new Date();
    isRunning = true;

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║               🚀 ADVANCED KEEP-ALIVE SYSTEM ACTIVATED                  ║');
    console.log('╠════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Target URL: ${healthUrl.padEnd(56)} ║`);
    console.log(`║  Interval: Every ${KEEP_ALIVE_INTERVAL_MINUTES} minutes                                              ║`);
    console.log(`║  Timeout: ${PING_TIMEOUT_MS / 1000} seconds per ping                                       ║`);
    console.log(`║  Max Retries: ${MAX_RETRIES} attempts per ping                                       ║`);
    console.log(`║  Purpose: Prevent Render Free Tier sleep (15-min inactivity)           ║`);
    console.log('╚════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    // Perform initial ping after a short delay (let server fully start)
    setTimeout(async () => {
        console.log('[KeepAlive] 🎯 Performing initial ping...');
        await performKeepAlivePing(healthUrl);
    }, 5000);

    // Schedule subsequent pings
    intervalId = setInterval(() => {
        performKeepAlivePing(healthUrl);
    }, KEEP_ALIVE_INTERVAL_MS);

    // Make interval non-blocking for graceful shutdown
    intervalId.unref();
};

/**
 * Stops the keep-alive mechanism
 */
const stopSelfPing = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
        console.log('[KeepAlive] ⏹️ Keep-alive system stopped');
    }
};

/**
 * Gets the current keep-alive status for monitoring
 * @returns {object} Current statistics and status
 */
const getKeepAliveStatus = () => {
    const now = new Date();
    const uptimeMs = stats.startTime ? now - stats.startTime : 0;
    const nextPingIn = stats.lastPingTime
        ? Math.max(0, KEEP_ALIVE_INTERVAL_MS - (now - stats.lastPingTime))
        : KEEP_ALIVE_INTERVAL_MS;

    return {
        isRunning,
        config: {
            intervalMinutes: KEEP_ALIVE_INTERVAL_MINUTES,
            timeoutSeconds: PING_TIMEOUT_MS / 1000,
            maxRetries: MAX_RETRIES,
            targetUrl: process.env.RENDER_EXTERNAL_URL
                ? `${process.env.RENDER_EXTERNAL_URL}/health`
                : null,
        },
        stats: {
            ...stats,
            uptimeMinutes: Math.floor(uptimeMs / 60000),
            successRate: stats.totalPings > 0
                ? ((stats.successfulPings / stats.totalPings) * 100).toFixed(1) + '%'
                : 'N/A',
            nextPingInSeconds: Math.ceil(nextPingIn / 1000),
        },
    };
};

export default startSelfPing;
export { startSelfPing, stopSelfPing, getKeepAliveStatus };
