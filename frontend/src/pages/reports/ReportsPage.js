import React, { useState } from 'react';
import { reportAPI } from '../../api';
import { Card, CardHeader, Button, Badge, PageLoader, Table } from '../../components/ui';
import { formatCurrency, statusColor } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RefreshCw, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';

const REPORTS = ['Valuation', 'Low Stock', 'Stock Movement', 'PO Summary', 'Sales Summary'];

export default function ReportsPage() {
  const [tab,     setTab]     = useState('Valuation');
  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState({});
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');

  const downloadPDF = async () => {
    try {
      let blob;
      if (tab === 'Valuation')      blob = (await reportAPI.downloadStockValuationPDF()).data;
      else if (tab === 'Low Stock') blob = (await reportAPI.downloadLowStockPDF()).data;
      else if (tab === 'Stock Movement') blob = (await reportAPI.downloadStockMovementPDF({ from, to })).data;
      else if (tab === 'PO Summary')     blob = (await reportAPI.downloadPOSummaryPDF({ from, to })).data;
      else if (tab === 'Sales Summary')  blob = (await reportAPI.downloadSalesSummaryPDF({ from, to })).data;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date().toISOString().split('T')[0];
      a.download = `${tab.toLowerCase().replace(/ /g, '-')}-${now}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to download PDF');
    }
  };

  const load = async (report = tab) => {
    setLoading(l => ({ ...l, [report]: true }));
    try {
      let res;
      if (report === 'Valuation')      res = await reportAPI.getStockValuation();
      else if (report === 'Low Stock') res = await reportAPI.getLowStock();
      else if (report === 'Stock Movement') res = await reportAPI.getStockMovement({ from, to });
      else if (report === 'PO Summary')     res = await reportAPI.getPOSummary({ from, to });
      else if (report === 'Sales Summary')  res = await reportAPI.getSalesSummary({ from, to });
      setData(d => ({ ...d, [report]: res.data.data }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(l => ({ ...l, [report]: false }));
    }
  };

  const handleTabChange = (t) => { setTab(t); };

  const valuationCols = [
    { key: 'sku',          label: 'SKU',      render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.sku}</span> },
    { key: 'name',         label: 'Product' },
    { key: 'category_name',label: 'Category' },
    { key: 'total_qty',    label: 'Qty',      render: r => <span className="font-bold">{r.total_qty}</span> },
    { key: 'unit_price',   label: 'Unit Price', render: r => formatCurrency(r.unit_price) },
    { key: 'total_value',  label: 'Total Value', render: r => <span className="font-bold text-indigo-600">{formatCurrency(r.total_value)}</span> },
  ];

  const lowStockCols = [
    { key: 'sku',           label: 'SKU',      render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.sku}</span> },
    { key: 'name',          label: 'Product' },
    { key: 'category_name', label: 'Category' },
    { key: 'total_stock',   label: 'Stock',    render: r => <span className="font-bold text-red-600">{r.total_stock}</span> },
    { key: 'reorder_level', label: 'Min' },
    { key: 'shortage',      label: 'Shortage', render: r => <Badge className="bg-red-100 text-red-800">-{r.shortage}</Badge> },
    { key: 'preferred_supplier', label: 'Supplier' },
  ];

  const movementCols = [
    { key: 'txn_day',       label: 'Date' },
    { key: 'sku',           label: 'SKU' },
    { key: 'product_name',  label: 'Product' },
    { key: 'warehouse_name',label: 'Warehouse' },
    { key: 'txn_type',      label: 'Type', render: r => <Badge className={statusColor(r.txn_type)}>{r.txn_type}</Badge> },
    { key: 'txn_count',     label: 'Transactions' },
    { key: 'total_qty',     label: 'Total Qty', render: r => <span className="font-bold">{r.total_qty}</span> },
  ];

  const poSummaryCols = [
    { key: 'company_name', label: 'Supplier' },
    { key: 'status',       label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    { key: 'po_count',     label: '# POs' },
    { key: 'total_value',  label: 'Total Value', render: r => formatCurrency(r.total_value) },
    { key: 'avg_days_to_close', label: 'Avg Days', render: r => r.avg_days_to_close ? `${parseFloat(r.avg_days_to_close).toFixed(1)}d` : '—' },
  ];

  const salesCols = [
    { key: 'customer_name',  label: 'Customer' },
    { key: 'order_count',    label: 'Orders' },
    { key: 'total_revenue',  label: 'Revenue',   render: r => <span className="font-bold text-green-700">{formatCurrency(r.total_revenue)}</span> },
    { key: 'avg_order_value',label: 'Avg Order', render: r => formatCurrency(r.avg_order_value) },
    { key: 'last_order_date',label: 'Last Order', render: r => r.last_order_date?.slice(0,10) || '—' },
  ];

  const current = data[tab];
  const isLoading = loading[tab];

  // Build chart data for valuation top 10
  const chartData = tab === 'Valuation' && current?.rows
    ? current.rows.slice(0,10).map(r => ({ name: r.name.slice(0,15), value: parseFloat(r.total_value) }))
    : [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Business intelligence and inventory insights</p></div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {REPORTS.map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Download button */}
      {current && !isLoading && (
        <div className="flex justify-end">
          <Button icon={FileDown} onClick={downloadPDF} variant="outline">
            Download PDF
          </Button>
        </div>
      )}
      {/* Date range picker for time-based reports */}
      {['Stock Movement','PO Summary','Sales Summary'].includes(tab) && (
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <Button icon={RefreshCw} onClick={() => load(tab)}>Run Report</Button>
          </div>
        </Card>
      )}

      {/* Auto-load for non-date reports */}
      {!['Stock Movement','PO Summary','Sales Summary'].includes(tab) && !current && !isLoading && (
        <div className="text-center py-8">
          <Button onClick={() => load(tab)}>Load {tab} Report</Button>
        </div>
      )}

      {isLoading && <PageLoader />}

      {/* Valuation */}
      {tab === 'Valuation' && current && !isLoading && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Total Inventory Value"
              actions={<span className="text-2xl font-bold text-indigo-700">{formatCurrency(current.grand_total)}</span>} />
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card padding={false}>
            <Table columns={valuationCols} data={current.rows} />
          </Card>
        </div>
      )}

      {tab === 'Low Stock'      && current && !isLoading && <Card padding={false}><Table columns={lowStockCols} data={current} /></Card>}
      {tab === 'Stock Movement' && current && !isLoading && <Card padding={false}><Table columns={movementCols} data={current} /></Card>}
      {tab === 'PO Summary'     && current && !isLoading && <Card padding={false}><Table columns={poSummaryCols} data={current} /></Card>}
      {tab === 'Sales Summary'  && current && !isLoading && <Card padding={false}><Table columns={salesCols} data={current} /></Card>}
    </div>
  );
}
