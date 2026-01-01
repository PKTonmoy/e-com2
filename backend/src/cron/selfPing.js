export const startSelfPing = (port) => {
    const SERVER_URL = process.env.SERVER_URL || `http://localhost:${port}`;

    const ping = () => {
        fetch(`${SERVER_URL}/health`)
            .then((res) => {
                if (res.ok) {
                    console.log(`[SelfPing] Pinged ${SERVER_URL}/health - Status: ${res.status}`);
                } else {
                    console.warn(`[SelfPing] Failed to ping ${SERVER_URL}/health - Status: ${res.status}`);
                }
            })
            .catch((err) => {
                console.error(`[SelfPing] Error pinging ${SERVER_URL}/health:`, err.message);
            });
    };

    // Ping immediately on start
    ping();

    // Schedule ping
    setInterval(ping, 300000); // 5 minutes
};
