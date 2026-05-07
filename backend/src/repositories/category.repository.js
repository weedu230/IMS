const { Op }         = require('sequelize');
const BaseRepository = require('./base.repository');
const { Category }   = require('../models');

class CategoryRepository extends BaseRepository {
  constructor() { super(Category); }

  async findAllPaginated(query) {
    const { limit, offset, page } = this._paginate(query);
    const where = {};
    if (query.search) {
      where.category_name = { [Op.like]: `%${query.search}%` };
    }
    if (query.parent_id !== undefined) {
      where.parent_id = query.parent_id === 'null' ? null : query.parent_id;
    }
    const { rows, count } = await Category.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'parentCategory', attributes: ['category_id','category_name'] },
        { model: Category, as: 'subCategories',  attributes: ['category_id','category_name'] },
      ],
      limit, offset,
      distinct: true,
    });
    return this._paginated(rows, count, page, limit);
  }

  async findByIdWithChildren(id) {
    return Category.findByPk(id, {
      include: [
        { model: Category, as: 'parentCategory', attributes: ['category_id','category_name'] },
        { model: Category, as: 'subCategories',  attributes: ['category_id','category_name'] },
      ],
    });
  }
}

module.exports = new CategoryRepository();
