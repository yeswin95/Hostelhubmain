const Menu = require("../models/Menu");
const asyncHandler = require("../utils/asyncHandler");

const getMenu = asyncHandler(async (_req, res) => {
  const menu = await Menu.find().sort({ day: 1 });
  res.status(200).json({ success: true, count: menu.length, menu });
});

const upsertMenuByDay = asyncHandler(async (req, res) => {
  const menu = await Menu.findOneAndUpdate({ day: req.params.day }, req.body, {
    new: true,
    upsert: true,
    runValidators: true
  });
  res.status(200).json({ success: true, menu });
});

module.exports = { getMenu, upsertMenuByDay };
