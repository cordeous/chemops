export default function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="table-th">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="table-td text-center py-12 text-gray-400">Loading...</td></tr>
          ) : !data?.length ? (
            <tr>
              <td colSpan={columns.length} className="table-td">
                <div className="empty-state">
                  <div className="text-4xl mb-3">📭</div>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row._id || i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className="table-td">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
