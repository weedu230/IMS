class ReportQueryBuilder {
  constructor() {
    this.params = [];
    this.conditions = [];
    this.groupBy = '';
    this.orderBy = '';
    this.limit = null;
    this.offset = null;
  }

  dateRange(column, from, to) {
    if (from && to) {
      this.conditions.push(`${column} BETWEEN ? AND ?`);
      this.params.push(from, to);
    }
    return this;
  }

  equals(column, value) {
    if (value !== undefined && value !== null && value !== '') {
      this.conditions.push(`${column} = ?`);
      this.params.push(value);
    }
    return this;
  }

  like(column, value) {
    if (value !== undefined && value !== null && value !== '') {
      this.conditions.push(`${column} LIKE ?`);
      this.params.push(`%${value}%`);
    }
    return this;
  }

  in(column, values = []) {
    const list = Array.isArray(values) ? values.filter(Boolean) : [];
    if (list.length) {
      this.conditions.push(`${column} IN (${list.map(() => '?').join(', ')})`);
      this.params.push(...list);
    }
    return this;
  }

  pagination(limit, offset) {
    if (limit !== undefined && limit !== null) this.limit = limit;
    if (offset !== undefined && offset !== null) this.offset = offset;
    return this;
  }

  order(clause) {
    this.orderBy = clause;
    return this;
  }

  group(clause) {
    this.groupBy = clause;
    return this;
  }

  buildWhere(prefix = 'WHERE') {
    if (!this.conditions.length) return { clause: '', params: this.params };
    return { clause: `${prefix} ${this.conditions.join(' AND ')}`, params: this.params };
  }

  buildLimitOffset() {
    const parts = [];
    if (this.limit !== null) parts.push('LIMIT ?');
    if (this.offset !== null) parts.push('OFFSET ?');
    return parts.length ? ` ${parts.join(' ')}` : '';
  }
}

module.exports = ReportQueryBuilder;