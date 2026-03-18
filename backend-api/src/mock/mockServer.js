const commodityPrices = require("./data/commodity-prices.json");
const iascTraces = require("./data/iasc-traces.json");

function getPrices({ commodity, region, startDate, endDate }) {
  return commodityPrices.filter((entry) => {
    if (commodity && entry.commodity !== commodity.toUpperCase()) {
      return false;
    }

    if (region && entry.region !== region.toUpperCase()) {
      return false;
    }

    if (startDate && entry.date < startDate) {
      return false;
    }

    if (endDate && entry.date > endDate) {
      return false;
    }

    return true;
  });
}

function getLatestPriceByCommodity(commodity) {
  const filtered = commodityPrices
    .filter((entry) => entry.commodity === commodity.toUpperCase())
    .sort((a, b) => b.date.localeCompare(a.date));

  return filtered[0] || null;
}

function verifyIascTrace(referenceId) {
  return iascTraces.find((trace) => trace.referenceId === referenceId.toUpperCase()) || null;
}

function getMockHealth() {
  return {
    status: "healthy",
    dataset: {
      commodityPrices: commodityPrices.length,
      iascTraces: iascTraces.length,
    },
  };
}

module.exports = {
  getPrices,
  getLatestPriceByCommodity,
  verifyIascTrace,
  getMockHealth,
};
