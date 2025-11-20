// utils/controllerFactory.js
const APIFeatures = require("./apiFeatures");
const { Op } = require("sequelize");
const { search } = require("./search");

const createController = (Model, modelName, searchFields, include = []) => {
  const name = modelName.toLowerCase();

  // Get all documents
  const getAll = async (req, res) => {
    try {
      if (req.query.search) {
        return await search(Model, modelName, searchFields, req, res, include);
      }

      const features = new APIFeatures(Model, req.query, include)
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const [docs, count] = await features.execute();

      // Hide sensitive fields for user
      if (modelName === "user") {
        docs.forEach((doc) => {
          if (doc.password) doc.password = undefined;
          if (doc.refreshToken) doc.refreshToken = undefined;
        });
      }

      res.status(200).json({
        status: "success",
        results: docs.length,
        total: count,
        data: docs,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Create one
  const createOne = async (req, res) => {
    try {
      console.log(req.body);
      const newDoc = await Model.create(req.body);
      res.status(201).json({
        status: "success",
        data: newDoc,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Get one by ID
  const getOneById = async (req, res) => {
    try {
      const id = req.params.id;

      // Optional student access restriction
      if (modelName === "student" && req.user.role === "Student") {
        if (id !== String(req.user.profileId)) {
          return res.status(403).json({
            status: "fail",
            message: "You Think You Are Smart Get Gud",
          });
        }
      }

      const doc = await Model.findByPk(id, { include });

      if (!doc) return res.status(404).json({ message: `${name} not found` });

      res.status(200).json({ status: "success", data: doc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Update one
  const updateOne = async (req, res) => {
    try {
      const id = req.params.id;
      const doc = await Model.findByPk(id);

      if (!doc) return res.status(404).json({ message: `${name} not found` });

      await doc.update(req.body);
      const updatedDoc = await Model.findByPk(id, { include });

      res.status(200).json({ status: "success", data: updatedDoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Soft delete (deactivate)
  const deactivateOne = async (req, res) => {
    try {
      const id = req.params.id;
      const doc = await Model.findByPk(id);

      if (!doc) return res.status(404).json({ message: `${name} not found` });

      await doc.update({ active: false });
      res.status(200).json({
        status: "success",
        message: `${name} deactivated`,
        data: doc,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Hard delete
  const deleteOne = async (req, res) => {
    try {
      const id = req.params.id;
      const deleted = await Model.destroy({ where: { id } });

      if (!deleted)
        return res.status(404).json({ message: `${name} not found` });

      res.status(204).json({ status: "success" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Create many
  const createMany = async (req, res) => {
    try {
      const docs = req.body.docs;
      if (!docs || !Array.isArray(docs) || docs.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid input: 'docs' must be a non-empty array.",
        });
      }

      const newDocs = await Model.bulkCreate(docs, { validate: true });
      res.status(201).json({
        status: "success",
        results: newDocs.length,
        data: newDocs,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Deactivate many
  const deactivateMany = async (req, res) => {
    try {
      const ids = req.body.ids;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid input: 'ids' must be a non-empty array.",
        });
      }

      const [updatedCount] = await Model.update(
        { active: false },
        { where: { id: { [Op.in]: ids } } }
      );

      if (!updatedCount) {
        return res.status(404).json({
          status: "fail",
          message: "No matching records found or already deactivated.",
        });
      }

      res.status(200).json({
        status: "success",
        message: `${updatedCount} ${name}(s) deactivated successfully`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  // Delete many
  const deleteMany = async (req, res) => {
    try {
      const ids = req.body.ids;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid input: 'ids' must be a non-empty array.",
        });
      }

      const deletedCount = await Model.destroy({
        where: { id: { [Op.in]: ids } },
      });

      if (!deletedCount) {
        return res.status(404).json({
          status: "fail",
          message: "No matching records found or already deleted.",
        });
      }

      res.status(200).json({
        status: "success",
        message: `${deletedCount} ${name}(s) deleted successfully`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  return {
    getAll,
    createOne,
    getOneById,
    updateOne,
    deactivateOne,
    deleteOne,
    deactivateMany,
    deleteMany,
    createMany,
  };
};

module.exports = createController;
