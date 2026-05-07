const { AuditLog }  = require('../models');
const { PAGINATION } = require('../utils/constants');

/**
 * BaseRepository
 * Provides shared helpers used by every domain repository.
 * Extend this class and call super(Model) from the constructor.
 */
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /** Build { limit, offset } from page/limit query params */
  _paginate(query = {}) {
    const page  = Math.max(1, parseInt(query.page,  10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    return { limit, offset: (page - 1) * limit, page };
  }

  /** Wrap Sequelize findAndCountAll result into a standard pagination envelope */
  _paginated(rows, count, page, limit) {
    return {
      data:        rows,
      total:       count,
      page,
      limit,
      totalPages:  Math.ceil(count / limit),
    };
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findById(id, options = {}) {
    const pk = Object.keys(this.model.primaryKeys)[0];
    return this.model.findOne({ where: { [pk]: id }, ...options });
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    const pk   = Object.keys(this.model.primaryKeys)[0];
    const [n]  = await this.model.update(data, { where: { [pk]: id } });
    return n;  // rows affected
  }

  async delete(id) {
    const pk  = Object.keys(this.model.primaryKeys)[0];
    const [n] = await this.model.update(
      { is_active: false }, { where: { [pk]: id } }
    );
    return n;
  }

  /** Write to audit_log.  Call from services that need change tracking. */
  async audit({ table_name, record_id, action, old_values, new_values, changed_by }) {
    return AuditLog.create({ table_name, record_id, action, old_values, new_values, changed_by });
  }
}

module.exports = BaseRepository;
