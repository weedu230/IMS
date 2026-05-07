import React, { useEffect, useState } from 'react';
import { auditAPI } from '../../api';
import { Card, CardHeader, Button, Badge, Alert, Table, Pagination, Select, Input, PageLoader } from '../../components/ui';
import { formatDateTime } from '../../utils/helpers';
import { RefreshCw, Filter, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIONS = ['INSERT', 'UPDATE', 'DELETE'];

export default function AuditLogsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ table_name: '', action: '', from: '', to: '' });
  const [draft, setDraft] = useState(filters);

  const fetchLogs = async (page = meta.page, nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: meta.limit,
        ...Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value)),
      };
      const res = await auditAPI.getAll(params);
      const payload = res.data.data;
      setRows(payload.data || []);
      setMeta({
        page: payload.page || 1,
        limit: payload.limit || 20,
        total: payload.total || 0,
        totalPages: payload.totalPages || 0,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load audit logs';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setFilters(draft);
    fetchLogs(1, draft);
  };

  const resetFilters = () => {
    const empty = { table_name: '', action: '', from: '', to: '' };
    setDraft(empty);
    setFilters(empty);
    fetchLogs(1, empty);
  };

  const columns = [
    { key: 'changed_at', label: 'Time', render: row => <span className="text-xs text-gray-500">{formatDateTime(row.changed_at)}</span> },
    { key: 'table_name', label: 'Table', render: row => <Badge className="bg-indigo-100 text-indigo-800">{row.table_name}</Badge> },
    { key: 'action', label: 'Action', render: row => <Badge className={row.action === 'DELETE' ? 'bg-red-100 text-red-800' : row.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>{row.action}</Badge> },
    { key: 'record_id', label: 'Record ID' },
    { key: 'changedBy', label: 'Changed By', render: row => row.changedBy ? row.changedBy.name || row.changedBy.email : 'System' },
    { key: 'old_values', label: 'Old Values', render: row => <span className="text-xs text-gray-600">{row.old_values ? JSON.stringify(row.old_values) : '—'}</span> },
    { key: 'new_values', label: 'New Values', render: row => <span className="text-xs text-gray-600">{row.new_values ? JSON.stringify(row.new_values) : '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Database level change history for admin users</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={() => fetchLogs(meta.page, filters)}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Narrow down changes by table, action, or date range" actions={<Filter size={16} className="text-gray-400" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input label="Table" placeholder="product" value={draft.table_name} onChange={(e) => setDraft((f) => ({ ...f, table_name: e.target.value }))} />
          <Select label="Action" value={draft.action} onChange={(e) => setDraft((f) => ({ ...f, action: e.target.value }))}>
            <option value="">All</option>
            {ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
          </Select>
          <Input label="From" type="date" value={draft.from} onChange={(e) => setDraft((f) => ({ ...f, from: e.target.value }))} />
          <Input label="To" type="date" value={draft.to} onChange={(e) => setDraft((f) => ({ ...f, to: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button icon={ShieldCheck} onClick={applyFilters}>Apply Filters</Button>
          <Button variant="secondary" onClick={resetFilters}>Reset</Button>
        </div>
      </Card>

      {error && <Alert message={error} />}
      {loading ? <PageLoader /> : (
        <Card padding={false}>
          <Table columns={columns} data={rows} emptyMessage="No audit logs found" />
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPage={(page) => fetchLogs(page, filters)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
