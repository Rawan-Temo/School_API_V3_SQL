const { Op } = require("sequelize");
const APIFeatures = require("./apiFeatures");
const User = require("../models/user");

const search = async (model, modelName, fields, req, res, include = []) => {
  try {
    const query = req.query.search;
    if (!query) {
      return res.status(400).json({
        status: "fail",
        message: "Search query is required",
      });
    }

    // Split search query into tokens
    const tokens = query.split(/\s+/);

    // Build Sequelize OR conditions for all tokens and fields
    const searchWhere = {
      [Op.and]: tokens.map((token) => ({
        [Op.or]: fields.map((field) => ({
          [field]: { [Op.like]: `%${token}%` },
        })),
      })),
    };

    // Merge search conditions into req.query for APIFeatures
    const features = new APIFeatures(model, req.query, include);
    features.options.where = { ...features.options.where, ...searchWhere };

    // Apply filter, sort, fields, and pagination
    features.filter().sort().limitFields().paginate();

    // Execute query
    const [results, total] = await features.execute();
    // Hide sensitive fields for user
    if (modelName === "user") {
      results.forEach((doc) => {
        if (doc.password) doc.password = undefined;
        if (doc.refreshToken) doc.refreshToken = undefined;
      });
    }
    res.status(200).json({
      status: "success",
      total,
      results: results.length,
      data: results,
    });
  } catch (err) {
    console.error("Sequelize search error:", err);
    res.status(500).json({
      status: "fail",
      message: err.message || "Something went wrong during the search",
    });
  }
};

module.exports = { search };
