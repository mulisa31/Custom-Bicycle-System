// This file contains API endpoints for managing components.
// Used by shop, admin panel, and stock pages.

const { Component } = require('../models');

// fetch all components for display
const getAllComponents = async (req, res) => {
  try {
    const components = await Component.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get a single component by id
const getComponentById = async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    res.status(200).json(component);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// add a new component 
const createComponent = async (req, res) => {
  try {
    const { name, description, category, unitPrice, stock, image_url } = req.body;
    const component = await Component.create({
      name,
      description: description || '',
      category: category || 'General',
      unitPrice,
      stockQuantity: stock || 0,
      image_url: image_url || null,
    });
    res.status(201).json({ message: 'Component created', component });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update an existing component
const updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, unitPrice, stock, image_url } = req.body;
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    await component.update({
      name: name || component.name,
      description: description || component.description,
      category: category || component.category,
      unitPrice: unitPrice !== undefined ? unitPrice : component.unitPrice,
      stockQuantity: stock !== undefined ? stock : component.stockQuantity,
      image_url: image_url || component.image_url,
    });
    res.status(200).json({ message: 'Component updated', component });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// delete a component
const deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.findByPk(id);
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    await component.destroy();
    res.status(200).json({ message: 'Component deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllComponents, getComponentById, createComponent, updateComponent, deleteComponent };