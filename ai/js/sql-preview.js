window.SqlPreview = (() => {
  const { escapeHTML } = window.Utils;

  const t = (key, fallback) => {
    try {
      return window.I18n?.t?.(key) || fallback;
    } catch {
      return fallback;
    }
  };

  const SQL_LANG_RE = /^sql$/i;
  const isSqlLang = (lang) => SQL_LANG_RE.test((lang || '').trim());

  const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
    'INSERT INTO', 'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'UNION', 'UNION ALL', 'WITH'
  ];

  let sqlFormatterPromise = null;

  const loadSqlFormatter = () => {
    if (window.sqlFormatter?.format) return Promise.resolve(window.sqlFormatter);
    if (sqlFormatterPromise) return sqlFormatterPromise;
    sqlFormatterPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sql-formatter@15.4.11/dist/sql-formatter.min.js';
      script.onload = () => resolve(window.sqlFormatter);
      script.onerror = () => reject(new Error('Failed to load SQL formatter'));
      document.head.appendChild(script);
    });
    return sqlFormatterPromise;
  };

  const formatSqlBasic = (sql) => {
    let out = String(sql || '').trim().replace(/\s+/g, ' ');
    [...SQL_KEYWORDS].sort((a, b) => b.length - a.length).forEach((kw) => {
      out = out.replace(new RegExp('\\s+' + kw.replace(/\s+/g, '\\s+') + '\\b', 'gi'), '\n' + kw);
    });
    return out.trim();
  };

  const formatSql = async (sql) => {
    try {
      const formatter = await loadSqlFormatter();
      return formatter.format(String(sql || '').trim(), { language: 'sql', tabWidth: 2 });
    } catch {
      return formatSqlBasic(sql);
    }
  };

  const stripComments = (sql) =>
    String(sql || '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--[^\n]*/g, ' ');

  const detectQueryType = (sql) => {
    const s = stripComments(sql).trim();
    if (/^\s*WITH\b/i.test(s) && /\bSELECT\b/i.test(s)) return 'SELECT (CTE)';
    if (/^\s*SELECT\b/i.test(s)) return 'SELECT';
    if (/^\s*INSERT\b/i.test(s)) return 'INSERT';
    if (/^\s*UPDATE\b/i.test(s)) return 'UPDATE';
    if (/^\s*DELETE\b/i.test(s)) return 'DELETE';
    if (/^\s*CREATE\b/i.test(s)) return 'CREATE';
    if (/^\s*ALTER\b/i.test(s)) return 'ALTER';
    if (/^\s*DROP\b/i.test(s)) return 'DROP';
    return 'SQL';
  };

  const extractClause = (sql, startKw, endKws) => {
    const s = stripComments(sql);
    const startRe = new RegExp('\\b' + startKw + '\\b', 'i');
    const startMatch = startRe.exec(s);
    if (!startMatch) return '';
    const rest = s.slice(startMatch.index + startMatch[0].length);
    let end = rest.length;
    endKws.forEach((kw) => {
      const re = new RegExp('\\b' + kw.replace(/\s+/g, '\\s+') + '\\b', 'i');
      const m = re.exec(rest);
      if (m && m.index < end) end = m.index;
    });
    return rest.slice(0, end).trim();
  };

  const extractTables = (sql) => {
    const tables = new Set();
    const s = stripComments(sql);
    const fromRe = /\b(?:FROM|JOIN|INTO|UPDATE)\s+([`"[\]]?)([\w.]+)\1/gi;
    let m;
    while ((m = fromRe.exec(s))) tables.add(m[2]);
    return [...tables];
  };

  const extractJoins = (sql) => {
    const joins = [];
    const re = /\b((?:INNER|LEFT|RIGHT|FULL|CROSS)\s+)?JOIN\s+[`"[\]]?[\w.]+[`"[\]]?(?:\s+AS\s+\w+|\s+\w+)?(?:\s+ON\s+[^;]+?)(?=\b(?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\b|\bWHERE\b|\bGROUP\b|\bORDER\b|\bLIMIT\b|$)/gi;
    let m;
    while ((m = re.exec(stripComments(sql)))) joins.push(m[0].trim().replace(/\s+/g, ' '));
    return joins;
  };

  const splitSelectColumns = (clause) => {
    const cols = [];
    let cur = '';
    let depth = 0;
    for (let i = 0; i < clause.length; i++) {
      const ch = clause[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        cols.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) cols.push(cur.trim());
    return cols;
  };

  const explainSql = (sql) => {
    const type = detectQueryType(sql);
    const tables = extractTables(sql);
    const joins = extractJoins(sql);
    const where = extractClause(sql, 'WHERE', ['GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION']);
    const groupBy = extractClause(sql, 'GROUP BY', ['HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION']);
    const orderBy = extractClause(sql, 'ORDER BY', ['LIMIT', 'OFFSET', 'UNION']);
    const limitMatch = stripComments(sql).match(/\bLIMIT\s+(\d+)/i);
    const selectClause = extractClause(sql.replace(/^[\s\S]*?\bSELECT\b/i, 'SELECT'), 'SELECT', ['FROM', 'UNION']);
    const columns = type.startsWith('SELECT') && selectClause
      ? splitSelectColumns(selectClause.replace(/^SELECT\s+/i, ''))
      : [];

    const notes = [t('sqlPreviewNoDb', 'No real database — analysis and mock results only.')];
    if (/\bUNION\b/i.test(sql)) notes.push(t('sqlPreviewUnionNote', 'UNION: mock results may be inaccurate.'));
    if (/\bSELECT\b[\s\S]*\bSELECT\b/i.test(sql) && /\(/i.test(sql)) notes.push(t('sqlPreviewSubqueryNote', 'Complex subquery: limited mock support.'));
    if (type === 'INSERT' || type === 'UPDATE' || type === 'DELETE') notes.push(t('sqlPreviewDmlNote', 'DML queries do not generate mock result tables.'));

    return { type, tables, joins, columns, where, groupBy, orderBy, limit: limitMatch ? Number(limitMatch[1]) : null, notes };
  };

  const mockValueForColumn = (colName, rowIndex) => {
    const name = String(colName || '').toLowerCase().replace(/^.*\./, '').replace(/[`"[\]]/g, '');
    if (name === 'id' || name.endsWith('_id')) return rowIndex + 1;
    if (/email/.test(name)) return 'user' + rowIndex + '@example.com';
    if (/name|title|label/.test(name)) return ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'][rowIndex % 5];
    if (/status|state/.test(name)) return ['active', 'pending', 'done'][rowIndex % 3];
    if (/amount|price|total|score|count|qty|quantity/.test(name)) return (rowIndex + 1) * 10;
    if (/date|time|created|updated|at$/.test(name)) return '2026-0' + (rowIndex + 1) + '-15';
    if (/bool|is_|has_/.test(name)) return rowIndex % 2 === 0 ? 'true' : 'false';
    if (/country|city/.test(name)) return ['Hanoi', 'Tokyo', 'Seoul', 'Singapore'][rowIndex % 4];
    return name + '_' + (rowIndex + 1);
  };

  const evalLiteral = (raw) => {
    const v = raw.trim();
    if (/^null$/i.test(v)) return null;
    if (/^'.*'$/.test(v) || /^".*"$/.test(v)) return v.slice(1, -1);
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  };

  const rowMatchesWhere = (row, columns, whereClause) => {
    if (!whereClause) return true;
    const simple = whereClause.match(/([`"[\]]?[\w.]+[`"[\]]?)\s*(=|!=|<>|>=|<=|>|<)\s*('(?:[^'\\]|\\.)*'|"[^"]*"|\d+(?:\.\d+)?|NULL)/i);
    if (!simple) return true;
    const colRef = simple[1].replace(/[`"[\]]/g, '').split('.').pop().toLowerCase();
    const op = simple[2];
    const lit = evalLiteral(simple[3]);
    const colIdx = columns.findIndex((c) => c.toLowerCase().includes(colRef));
    const val = colIdx >= 0 ? row[colIdx] : null;
    if (lit === null) return op === '=' ? val == null : val != null;
    switch (op) {
      case '=': return String(val) === String(lit);
      case '!=':
      case '<>': return String(val) !== String(lit);
      case '>': return Number(val) > Number(lit);
      case '>=': return Number(val) >= Number(lit);
      case '<': return Number(val) < Number(lit);
      case '<=': return Number(val) <= Number(lit);
      default: return true;
    }
  };

  const buildMockResult = (sql) => {
    const type = detectQueryType(sql);
    if (!type.startsWith('SELECT')) return null;
    if (/\bUNION\b/i.test(sql)) return null;

    const selectRaw = extractClause(sql.replace(/^[\s\S]*?\bSELECT\b/i, 'SELECT'), 'SELECT', ['FROM', 'UNION']);
    if (!selectRaw) return null;

    const fromClause = extractClause(sql, 'FROM', ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION']);
    if (!fromClause) {
      const cols = splitSelectColumns(selectRaw.replace(/^SELECT\s+/i, ''));
      const headers = cols.map((c, i) => {
        const alias = c.match(/\bAS\s+([`"[\]]?)(\w+)\1\s*$/i);
        if (alias) return alias[2];
        if (/^\d+(\.\d+)?$/.test(c.trim())) return 'col_' + (i + 1);
        if (/^'.*'$/.test(c.trim()) || /^".*"$/.test(c.trim())) return 'col_' + (i + 1);
        return c.trim().replace(/[`"[\]]/g, '').split('.').pop() || 'col_' + (i + 1);
      });
      const row = cols.map((c) => evalLiteral(c.trim()) ?? c.trim());
      return { headers, rows: [row], mock: true, note: t('sqlPreviewLiteralSelect', 'Literal SELECT — no FROM clause.') };
    }

    let colExpr = splitSelectColumns(selectRaw.replace(/^SELECT\s+/i, ''));
    if (colExpr.length === 1 && /^\*/.test(colExpr[0])) {
      colExpr = ['id', 'name', 'email', 'created_at'];
    }

    const headers = colExpr.map((c) => {
      const alias = c.match(/\bAS\s+([`"[\]]?)(\w+)\1\s*$/i);
      if (alias) return alias[2];
      const bare = c.replace(/[`"[\]]/g, '').split('.').pop().trim();
      if (/^\w+$/.test(bare) && !/^(count|sum|avg|min|max)$/i.test(bare)) return bare;
      if (/\bCOUNT\s*\(/i.test(c)) return 'count';
      if (/\bSUM\s*\(/i.test(c)) return 'sum';
      if (/\bAVG\s*\(/i.test(c)) return 'avg';
      return bare || 'expr';
    });

    const where = extractClause(sql, 'WHERE', ['GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION']);
    const limitMatch = stripComments(sql).match(/\bLIMIT\s+(\d+)/i);
    const limit = limitMatch ? Math.min(Number(limitMatch[1]), 20) : 5;

    const rows = [];
    for (let i = 0; i < limit; i++) {
      const row = headers.map((h, idx) => {
        const expr = colExpr[idx] || h;
        if (/\bCOUNT\s*\(\s*\*\s*\)/i.test(expr)) return limit;
        if (/\bCOUNT\s*\(/i.test(expr)) return i + 1;
        if (/\bSUM\s*\(/i.test(expr)) return (i + 1) * 100;
        if (/\bAVG\s*\(/i.test(expr)) return ((i + 1) * 10 + 5) / 2;
        const lit = expr.match(/^('.*'|".*"|\d+(?:\.\d+)?)$/);
        if (lit) return evalLiteral(lit[1]);
        return mockValueForColumn(h, i);
      });
      if (rowMatchesWhere(row, headers, where)) rows.push(row);
    }

    if (!rows.length) rows.push(headers.map((h) => mockValueForColumn(h, 0)));

    return {
      headers,
      rows: rows.slice(0, limit),
      mock: true,
      table: fromClause.split(/\s+/)[0].replace(/[`"[\]]/g, ''),
      note: t('sqlPreviewMockNote', 'Simulated data from column names and patterns — not real DB output.')
    };
  };

  const highlightSql = (formatted) => {
    if (window.hljs?.getLanguage?.('sql')) {
      try {
        return window.hljs.highlight(formatted, { language: 'sql', ignoreIllegals: true }).value;
      } catch { /* fall through */ }
    }
    return escapeHTML(formatted);
  };

  const explainRow = (label, value) => {
    if (!value || (Array.isArray(value) && !value.length)) return '';
    const content = Array.isArray(value)
      ? '<ul class="sql-explain-list">' + value.map((v) => '<li>' + escapeHTML(v) + '</li>').join('') + '</ul>'
      : '<span>' + escapeHTML(String(value)) + '</span>';
    return '<div class="sql-explain-row"><dt>' + escapeHTML(label) + '</dt><dd>' + content + '</dd></div>';
  };

  const buildMockTableHtml = (mock) => {
    if (!mock) return '';
    let thead = '<thead><tr>';
    mock.headers.forEach((h) => { thead += '<th>' + escapeHTML(h) + '</th>'; });
    thead += '</tr></thead>';
    let tbody = '<tbody>';
    mock.rows.forEach((row) => {
      tbody += '<tr>';
      row.forEach((cell) => {
        tbody += '<td>' + escapeHTML(cell == null ? 'NULL' : String(cell)) + '</td>';
      });
      tbody += '</tr>';
    });
    tbody += '</tbody>';
    return ''
      + '<section class="sql-preview-section sql-mock-section">'
      + '<h3 class="sql-preview-heading"><i class="fa-solid fa-table" aria-hidden="true"></i> ' + escapeHTML(t('sqlPreviewMockTitle', 'Mock results')) + '</h3>'
      + '<p class="sql-mock-note">' + escapeHTML(mock.note || '') + '</p>'
      + '<div class="csv-preview-scroll"><table class="csv-preview-table sql-mock-table">' + thead + tbody + '</table></div>'
      + '</section>';
  };

  const buildSqlPreviewHtml = (formatted, explained, mock) => {
    const notesHtml = explained.notes?.length
      ? '<ul class="sql-preview-notes">' + explained.notes.map((n) => '<li>' + escapeHTML(n) + '</li>').join('') + '</ul>'
      : '';

    let explainHtml = '<dl class="sql-explain">';
    explainHtml += explainRow('Type', explained.type);
    explainHtml += explainRow('Tables', explained.tables);
    explainHtml += explainRow('Joins', explained.joins);
    explainHtml += explainRow('Columns', explained.columns);
    explainHtml += explainRow('WHERE', explained.where);
    explainHtml += explainRow('GROUP BY', explained.groupBy);
    explainHtml += explainRow('ORDER BY', explained.orderBy);
    if (explained.limit != null) explainHtml += explainRow('LIMIT', String(explained.limit));
    explainHtml += '</dl>';

    const mockHtml = mock ? buildMockTableHtml(mock) : (
      explained.type.startsWith('SELECT')
        ? '<section class="sql-preview-section sql-mock-section"><p class="sql-mock-unavailable">' + escapeHTML(t('sqlPreviewMockUnavailable', 'Mock results not available for this complex query.')) + '</p></section>'
        : ''
    );

    return ''
      + '<div class="sql-preview-wrap">'
      + notesHtml
      + '<section class="sql-preview-section">'
      + '<h3 class="sql-preview-heading"><i class="fa-solid fa-code" aria-hidden="true"></i> SQL</h3>'
      + '<pre class="sql-preview-code"><code class="hljs language-sql">' + highlightSql(formatted) + '</code></pre>'
      + '</section>'
      + '<section class="sql-preview-section">'
      + '<h3 class="sql-preview-heading"><i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i> ' + escapeHTML(t('sqlPreviewExplainTitle', 'Explain')) + '</h3>'
      + explainHtml
      + '</section>'
      + mockHtml
      + '</div>';
  };

  const renderSqlPreview = async (container, source) => {
    if (!container) return;
    container.innerHTML = '<div class="graphviz-preview-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i></div>';
    try {
      const formatted = await formatSql(source);
      const explained = explainSql(source);
      const mock = buildMockResult(source);
      container.innerHTML = buildSqlPreviewHtml(formatted, explained, mock);
    } catch (err) {
      container.innerHTML = '<pre class="artifact-error">' + escapeHTML(err.message || String(err)) + '</pre>';
    }
  };

  return {
    isSqlLang,
    formatSql,
    explainSql,
    buildMockResult,
    buildSqlPreviewHtml,
    renderSqlPreview
  };
})();
