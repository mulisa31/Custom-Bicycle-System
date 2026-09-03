// This file defines compatibility routes and the compatibility check endpoint.


const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const { getAllRules, createRule, updateRule, deleteRule } = require('../controllers/compatibilityController');
const router = express.Router();

const { Op } = require('sequelize');
const { Compatibility, Component } = require('../models');

// view all rules
router.get('/', getAllRules);

// admin-only routes for changing rules
router.use(authenticate);
router.post('/', authorize('admin'), createRule);
router.put('/:id', authorize('admin'), updateRule);

router.delete('/:id', authorize('admin'), deleteRule);

// compatibility check for the bike builder
router.get('/check', authenticate, async (req, res) => {
  try {
    const { compA, compB } = req.query;

    // load the two components
    const componentA = await Component.findByPk(compA);
    const componentB = await Component.findByPk(compB);

    // only check important pairs like frame+fork and tires+wheels
    const importantPairs = [
      { cat1: 'Frame', cat2: 'Fork' },
      { cat1: 'Tires', cat2: 'Wheels' }
    ];

    const isImportant = importantPairs.some(p =>
      (p.cat1 === componentA.category && p.cat2 === componentB.category) ||
      (p.cat1 === componentB.category && p.cat2 === componentA.category)
    );

    // if not important, assume compatible
    if (!isImportant) {
      return res.json({ compatible: true, category: null });
    }

    // look for a rule that covers this pair
    const rule = await Compatibility.findOne({
      where: {
        [Op.or]: [
          { componentAId: compA, componentBId: compB },
          { componentAId: compB, componentBId: compA }
        ]
      }
    });

    // no rule means incompatible
    if (!rule) {
      return res.json({
        compatible: false,
        category: `${componentA.category} + ${componentB.category}`,
      });
    }

    res.json({
      compatible: rule.compatible,
      category: `${componentA.category} + ${componentB.category}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;