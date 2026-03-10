const axios = require('axios');
const { errorResponse } = require('../utils/apiResponse');

// Map app coin ids to CoinGecko API ids
const COIN_TO_COINGECKO = {
  usdt: 'tether',
  eth: 'ethereum',
  btc: 'bitcoin',
  bnb: 'binancecoin',
  sol: 'solana',
};

const COINGECKO_IDS = Object.values(COIN_TO_COINGECKO).join(',');
const COINGECKO_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=ngn`;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

let cachedRates = null;
let cachedAt = null;

function isCacheValid() {
  if (!cachedAt) return false;
  return Date.now() - cachedAt < CACHE_TTL_MS;
}

async function fetchAllRates() {
  const response = await axios.get(COINGECKO_URL, { timeout: 10000 });
  const data = response.data;
  const rates = {};
  for (const [appCoin, geckoId] of Object.entries(COIN_TO_COINGECKO)) {
    const ngn = data?.[geckoId]?.ngn;
    rates[appCoin] = typeof ngn === 'number' ? ngn : null;
  }
  return rates;
}

exports.getRate = async (req, res) => {
  try {
    const coin = (req.query.coin || 'usdt').toLowerCase();
    const geckoId = COIN_TO_COINGECKO[coin];

    if (!geckoId) {
      return res.status(200).json({
        status: 'success',
        rate: null,
        currency: 'NGN',
        crypto: coin.toUpperCase(),
        message: 'Unsupported coin',
      });
    }

    if (!isCacheValid()) {
      cachedRates = await fetchAllRates();
      cachedAt = Date.now();
    }

    const rate = cachedRates?.[coin] ?? null;

    if (rate == null) {
      return errorResponse(res, 500, 'Unable to fetch rate at this time');
    }

    return res.status(200).json({
      status: 'success',
      rate,
      currency: 'NGN',
      crypto: coin.toUpperCase(),
      cachedAt,
    });
  } catch (err) {
    return errorResponse(res, 500, 'Unable to fetch rate at this time');
  }
};
