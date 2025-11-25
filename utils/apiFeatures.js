const { Op } = require("sequelize");

class APIFeatures {
  constructor(model, queryString, include = []) {
    this.model = model; // Sequelize model
    this.queryString = queryString; // req.query
    this.options = {
      where: {},
      include,
    };
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    for (const key of Object.keys(queryObj)) {
      const value = queryObj[key];

      // Handle operators like ?id[gte]=3
      if (value && typeof value === "object") {
        for (const op in value) {
          if (["gte", "gt", "lte", "lt"].includes(op)) {
            if (!this.options.where[key]) this.options.where[key] = {};
            this.options.where[key][Op[op]] = isNaN(value[op])
              ? value[op]
              : Number(value[op]);
          }
        }
        continue; // skip to next key
      }

      // Handle multi-value fields: field_multi=a,b,c
      if (key.endsWith("_multi")) {
        const field = key.replace("_multi", "");
        const values = String(value)
          .split(",")
          .map((v) => (isNaN(v) ? v : Number(v)));
        this.options.where[field] = { [Op.in]: values };
        continue;
      }

      // Simple equality
      this.options.where[key] = isNaN(value) ? value : Number(value);
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // Convert comma-separated list into array of [field, direction]
      const order = this.queryString.sort.split(",").map((field) => {
        if (field.startsWith("-")) return [field.slice(1), "DESC"];
        return [field, "ASC"];
      });
      this.options.order = order;
    } else {
      this.options.order = [["createdAt", "DESC"]]; // default sort
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.options.attributes = this.queryString.fields.split(",");
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 100;
    const offset = (page - 1) * limit;
    this.options.limit = limit;
    this.options.offset = offset;
    return this;
  }

  async execute() {
    // Returns [rows, count]
    console.log(this.options);
    const rows = await this.model.findAll(this.options);
    const count = await this.model.count({ where: this.options.where });
    return [rows, count];
  }
  async findAll() {
    const rows = await this.model.findAll(this.options);
    return rows;
  }
  async countWithInclude(include) {
    const count = await this.model.count({
      where: this.options.where,
      include,
    });
    return count;
  }
}

module.exports = APIFeatures;
