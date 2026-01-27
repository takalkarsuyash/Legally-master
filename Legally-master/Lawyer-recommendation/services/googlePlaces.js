const axios = require("axios");

const BASE_URL = "https://maps.googleapis.com/maps/api/place";

exports.searchLawyers = async (query) => {
  const res = await axios.get(`${BASE_URL}/textsearch/json`, {
    params: {
      query,
      key: process.env.GOOGLE_PLACES_KEY,
    },
  });

  return res.data.results || [];
};

exports.getLawyerDetails = async (placeId) => {
  const res = await axios.get(`${BASE_URL}/details/json`, {
    params: {
      place_id: placeId,
      fields: "formatted_phone_number,website",
      key: process.env.GOOGLE_PLACES_KEY,
    },
  });

  const result = res.data.result || {};
  return {
    phone: result.formatted_phone_number || null,
    website: result.website || null,
  };
};
