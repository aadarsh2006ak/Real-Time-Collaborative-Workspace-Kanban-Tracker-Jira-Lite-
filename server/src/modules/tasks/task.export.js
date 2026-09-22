// server/src/modules/tasks/task.export.js
/**
 * Escapes values for standard RFC 4180 CSV
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a list of populated task documents into CSV string
 */
function tasksToCsv(tasks, columnsMap = {}) {
  const headers = [
    'Key',
    'Title',
    'Description',
    'Column',
    'Priority',
    'Assignees',
    'Labels',
    'DueDate',
    'CreatedAt',
  ];

  const rows = tasks.map((t) => {
    const columnName = columnsMap[String(t.columnId)] || 'Unknown';
    const assignees = (t.assignees || []).map((a) => a.name || a.email || a).join('; ');
    const labels = (t.labels || []).join('; ');
    const dueDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
    const createdAt = t.createdAt ? new Date(t.createdAt).toISOString() : '';

    return [
      escapeCsvValue(t.key),
      escapeCsvValue(t.title),
      escapeCsvValue(t.description),
      escapeCsvValue(columnName),
      escapeCsvValue(t.priority),
      escapeCsvValue(assignees),
      escapeCsvValue(labels),
      escapeCsvValue(dueDate),
      escapeCsvValue(createdAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Parses simple CSV content into array of row objects
 */
function parseCsv(csvString) {
  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple regex CSV parser handling quotes
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        if (inQuotes && line[c + 1] === '"') {
          current += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const row = {};
    headers.forEach((h, idx) => {
      row[h.toLowerCase()] = (values[idx] || '').trim();
    });
    results.push(row);
  }

  return results;
}

module.exports = {
  tasksToCsv,
  parseCsv,
  escapeCsvValue,
};
