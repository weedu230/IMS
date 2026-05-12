const { sequelize } = require('../config/database');
const models = require('../models');

class ArchitectureService {
  _modelEntries() {
    return Object.entries(models)
      .filter(([, model]) => model && model.rawAttributes && model.associations)
      .sort(([a], [b]) => a.localeCompare(b));
  }

  _mapType(attr) {
    const key = (attr.type && attr.type.key) || 'UNKNOWN';
    return String(key).toLowerCase();
  }

  _classDiagramFromModels() {
    const lines = ['classDiagram'];
    const modelEntries = this._modelEntries();

    for (const [name, model] of modelEntries) {
      lines.push(`class ${name} {`);
      for (const [attrName, attr] of Object.entries(model.rawAttributes)) {
        const type = this._mapType(attr);
        const flags = [
          attr.primaryKey ? 'PK' : null,
          attr.allowNull === false ? 'NN' : null,
        ].filter(Boolean).join(' ');
        lines.push(`  ${type} ${attrName}${flags ? ` ${flags}` : ''}`);
      }
      lines.push('}');
    }

    const edges = new Set();
    for (const [sourceName, model] of modelEntries) {
      for (const assoc of Object.values(model.associations)) {
        const targetName = assoc.target && assoc.target.name;
        if (!targetName) continue;

        let card = '"1" --> "1"';
        if (assoc.associationType === 'HasMany') card = '"1" --> "*"';
        if (assoc.associationType === 'BelongsTo') card = '"*" --> "1"';
        if (assoc.associationType === 'BelongsToMany') card = '"*" --> "*"';

        const label = assoc.as || assoc.associationType;
        const edge = `${sourceName} ${card} ${targetName} : ${label}`;
        edges.add(edge);
      }
    }

    lines.push(...Array.from(edges).sort());
    return lines.join('\n');
  }

  _erDiagramFromSchema(columns, foreignKeys) {
    const lines = ['erDiagram'];
    const byTable = new Map();

    for (const col of columns) {
      if (!byTable.has(col.TABLE_NAME)) byTable.set(col.TABLE_NAME, []);
      byTable.get(col.TABLE_NAME).push(col);
    }

    for (const [table, cols] of byTable.entries()) {
      lines.push(`  ${table.toUpperCase()} {`);
      for (const col of cols) {
        const tags = [];
        if (col.COLUMN_KEY === 'PRI') tags.push('PK');
        if (col.IS_NULLABLE === 'NO') tags.push('NN');
        lines.push(`    ${String(col.DATA_TYPE).toLowerCase()} ${col.COLUMN_NAME} ${tags.join(' ')}`.trimEnd());
      }
      lines.push('  }');
    }

    const rels = new Set();
    for (const fk of foreignKeys) {
      const parent = fk.REFERENCED_TABLE_NAME.toUpperCase();
      const child = fk.TABLE_NAME.toUpperCase();
      const edge = `  ${parent} ||--o{ ${child} : ${fk.COLUMN_NAME}`;
      rels.add(edge);
    }
    lines.push(...Array.from(rels).sort());

    return lines.join('\n');
  }

  async getUml(type = 'all') {
    const diagramType = String(type || 'all').toLowerCase();
    const result = {
      generatedAt: new Date().toISOString(),
      type: diagramType,
      classDiagram: null,
      erDiagram: null,
    };

    if (diagramType === 'all' || diagramType === 'class') {
      result.classDiagram = this._classDiagramFromModels();
    }

    if (diagramType === 'all' || diagramType === 'er') {
      const [columns] = await sequelize.query(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY, IS_NULLABLE, ORDINAL_POSITION
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `);

      const [foreignKeys] = await sequelize.query(`
        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `);

      result.erDiagram = this._erDiagramFromSchema(columns, foreignKeys);
    }

    return result;
  }
}

module.exports = new ArchitectureService();