// Fallback exchange rates against BDT (used if live currency API fails or times out)
const FALLBACK_RATES_TO_BDT = {
    BDT: 1.0,
    USD: 120.0,
    EUR: 130.0,
    CNY: 16.5,
    GBP: 152.0
};

/**
 * Fetch live exchange rates for foreign currencies against BDT
 * Uses open API with timeout and immediate safe fallback handling.
 */
exports.getExchangeRates = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch("https://open.er-api.com/v6/latest/USD", {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`API response HTTP ${response.status}`);
        const data = await response.json();

        if (data && data.rates && data.rates.BDT) {
            const usdToBdt = data.rates.BDT;
            const rates = {
                BDT: 1.0,
                USD: Number(usdToBdt.toFixed(2)),
                EUR: Number((usdToBdt / (data.rates.EUR || 0.92)).toFixed(2)),
                CNY: Number((usdToBdt / (data.rates.CNY || 7.25)).toFixed(2)),
                GBP: Number((usdToBdt / (data.rates.GBP || 0.78)).toFixed(2))
            };
            return { rates, isFallback: false, source: "Live Exchange Rate API (er-api.com)" };
        } else {
            throw new Error("Invalid rate structure from API");
        }
    } catch (error) {
        // Safe Fallback Rate Usage
        return {
            rates: FALLBACK_RATES_TO_BDT,
            isFallback: true,
            source: "Safe System Fallback Rates (Offline / API Timeout)",
            fallbackReason: error.message
        };
    }
};

/**
 * Convert foreign currency amount to BDT
 */
exports.convertToBDT = (amount, currency, rates) => {
    const rate = rates[currency] || FALLBACK_RATES_TO_BDT[currency] || 1.0;
    return {
        convertedBDT: Number((amount * rate).toFixed(2)),
        appliedRate: rate
    };
};
