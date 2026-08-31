/**
 * Utility to export data as CSV and trigger a browser download.
 */
export function exportToCSV(filename: string, data: any[]) {
  if (!data || !data.length) {
    alert("No data available to export");
    return;
  }

  // 1. Extract headers from the first object
  const headers = Object.keys(data[0]);

  // 2. Convert objects to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => {
      return headers.map(fieldName => {
        let value = row[fieldName];
        
        // Handle null/undefined
        if (value === null || value === undefined) value = '';
        
        // Handle dates
        if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('at')) {
          if (typeof value === 'number' || !isNaN(Date.parse(value))) {
            value = new Date(value).toLocaleString().replace(/,/g, '');
          }
        }

        // Handle arrays (e.g. items)
        if (Array.isArray(value)) {
          value = `"${value.map(v => typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '""') : v).join('; ')}"`;
        }

        // Handle strings with commas
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      }).join(',');
    })
  ].join('\n');

  // 3. Create blob and download
  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
