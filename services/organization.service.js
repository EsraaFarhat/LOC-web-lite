const Joi = require("joi");
const GlobalIdentifier = require("../models/globalidentifier");

const Organization = require("../models/organization");
const User = require("../models/user");

exports.findOrganizationById = async (id) => {
  try {
    const organization = await Organization.findByPk(id);
    return organization;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.findOrganization = async (filter) => {
  try {
    const organization = await Organization.findOne({
      where: filter,
    });
    return organization;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.getAllOrganizations = async (filter) => {
  try {
    const organization = await Organization.findAll({
      where: filter,
    });
    return organization;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.createOrganization = async (request) => {
  try {
    const newOrganization = await Organization.create(request);
    return newOrganization;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.updateOrganization = async (filter, request) => {
  try {
    const organization = await Organization.update(request, {
      where: filter,
      returning: true,
    });
    return organization;
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.deleteOrganization = async (id) => {
  try {
    await Organization.destroy({ where: { id } });
  } catch (e) {
    throw new Error(e.message);
  }
};

exports.validateOrganization = (organization) => {
  const schema = Joi.object({
    name: Joi.string().trim().max(50).required(),
    fullName: Joi.string().trim().min(3).max(21).required(),
    email: Joi.string().trim().max(255).required().email(),
  });
  return schema.validate(organization, { abortEarly: false });
};

exports.validateUpdateOrganization = (organization) => {
  const schema = Joi.object({
    name: Joi.string().trim().max(50),
  });
  return schema.validate(organization, { abortEarly: false });
};
