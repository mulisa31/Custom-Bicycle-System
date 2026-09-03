// This file manages compatibility rules between bike components.
// Used by the admin compatibility page and the bike builder checks.

const { Compatibility, Component } = require('../models');

// Get all rules with component names included
const getAllRules = async (req, res) => {
  try {
    const rules = await Compatibility.findAll({
      include: [
        { model: Component, as: 'ComponentA', attributes: ['id', 'name'] },
        { model: Component, as: 'ComponentB', attributes: ['id', 'name'] }
      ]
    });
    res.status(200).json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new rule (admin only)
const createRule = async (req, res) => {
  try {
    const { componentAId, componentBId, compatible } = req.body;

    // stop duplicates before saving
    const existing = await Compatibility.findOne({ where: { componentAId, componentBId } });
    if (existing) return res.status(400).json({ error: 'Rule already exists.' });

    const rule = await Compatibility.create({ componentAId, componentBId, compatible });
    res.status(201).json({ message: 'Compatibility rule created!', rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update just the compatible flag on a rule
const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { compatible } = req.body;

    const rule = await Compatibility.findByPk(id);
    if (!rule) return res.status(404).json({ error: 'Rule not found.' });

    await rule.update({ compatible });
    res.status(200).json({ message: 'Rule updated!', rule });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a rule
const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await Compatibility.findByPk(id);
    if (!rule) return res.status(404).json({ error: 'Rule not found.' });

    await rule.destroy();
    res.status(200).json({ message: 'Rule deleted successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllRules, createRule, updateRule, deleteRule };