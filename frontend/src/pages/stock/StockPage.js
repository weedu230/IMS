import React, { useState, useEffect } from 'react';
import { stockAPI, productAPI, warehouseAPI } from '../../api';
import {
  Card, Table, Button, Badge, Modal, Input, Select,
  SearchBar, Pagination, Alert, StatCard, Spinner,
} from '../../components/ui';
import { formatDateTime, statusColor, getErrorMessage } from '../../utils/helpers';
import { usePagination, useDebounce } from '../../hooks/useApi';
import { AlertTriangle, ArrowLeftRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Levels', 'Transactions', 'Low Stock'];
const TXN_TYPES = ['IN','OUT','ADJUSTMENT','RETURN','WRITE_OFF'];

export default function StockPage() {
  const [tab,          setTab]          = useState('Levels');
  const [levels,       setLevels]       = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [lowStock,     setLowStock]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [products,     setProducts]     = useState([]);
  const [warehouses,   setWarehouses]   = useState([]);

  // Adjust modal
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm,  setAdjForm]  = useState({ product_id:'', warehouse_id:'', txn_type:'IN', quantity:1, notes:'' });
  const [adjErr,   setAdjErr]   = useState('');
  const [saving,   setSaving]   = useState(false);

  // Transfer modal
  const [xfrModal, setXfrModal] = useState(false);
  const [xfrForm,  setXfrForm]  = useState({ product_id:'', from_warehouse_id:'', to_warehouse_id:'', quantity:1 });
  const [xfrErr,   setXfrErr]   = useState('');

  const { page, limit, setPage, reset } = usePagination(20);
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 400);

  useEffect(() => {
    productAPI.getAll({ limit: 200 }).then(r => setProducts(r.data.data?.data || []));
    warehouseAPI.getAll({ limit: 50 }).then(r => setWarehouses(r.data.data?.data || []));
  }, []);

  useEffect(() => { loadTab(); }, [tab, page, q]);

  useEffect(() => {
    const token = localStorage.getItem('ims_token');
    if (!token) return undefined;

    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    const stream = new EventSource(`${base}/stock/stream?token=${encodeURIComponent(token)}`);

    const refresh = () => loadTab();

    stream.addEventListener('stock-update', refresh);
    stream.addEventListener('ready', () => {});
    stream.addEventListener('heartbeat', () => {});
    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
    };
  }, [tab, page, q]);

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'Levels') {
        const r = await stockAPI.getAll({ page, limit });
        setLevels(r.data.data);
      } else if (tab === 'Transactions') {
        const r = await stockAPI.getTransactions({ page, limit });
        setTransactions(r.data.data);
      } else {
        const r = await stockAPI.getLowStock();
        setLowStock(r.data.data || []);
      }
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const handleAdjust = async () => {
    setSaving(true); setAdjErr('');
    try {
      await stockAPI.adjust({ ...adjForm, quantity: parseInt(adjForm.quantity) });
      toast.success('Stock adjusted successfully');
      setAdjModal(false);
      loadTab();
    } catch (e) { setAdjErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleTransfer = async () => {
    setSaving(true); setXfrErr('');
    try {
      await stockAPI.transfer({ ...xfrForm, quantity: parseInt(xfrForm.quantity) });
      toast.success('Transfer completed');
      setXfrModal(false);
      loadTab();
    } catch (e) { setXfrErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const levelCols = [
    { key: 'sku',    label: 'SKU',     render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.sku}</span> },
    { key: 'name',   label: 'Product', render: r => <span className="font-medium">{r.name}</span> },
    { key: 'bin_location', label: 'Bin', render: r => <Badge className="bg-slate-100 text-slate-700">{r.bin_location || 'MAIN'}</Badge> },
    { key: 'category', label: 'Category', render: r => r.category?.category_name || '—' },
    { key: 'total_stock', label: 'Total Stock', render: r => (
      <span className={`font-bold ${Number(r.total_stock) <= r.reorder_level ? 'text-red-600' : 'text-gray-900'}`}>
        {r.total_stock ?? 0}
      </span>
    )},
    { key: 'reorder_level', label: 'Reorder At' },
    { key: 'status', label: 'Status', render: r => Number(r.total_stock) <= r.reorder_level
      ? <Badge className="bg-red-100 text-red-800">⚠ Reorder</Badge>
      : <Badge className="bg-green-100 text-green-800">OK</Badge>
    },
  ];

  const txnCols = [
    { key: 'txn_id',       label: '#' },
    { key: 'product',      label: 'Product',   render: r => r.product?.name || '—' },
    { key: 'warehouse',    label: 'Warehouse', render: r => r.warehouse?.warehouse_name || '—' },
    { key: 'bin_location', label: 'Bin', render: r => r.bin_location || 'MAIN' },
    { key: 'txn_type',     label: 'Type',      render: r => <Badge className={statusColor(r.txn_type)}>{r.txn_type}</Badge> },
    { key: 'quantity',     label: 'Qty',       render: r => <span className="font-mono font-bold">{r.quantity}</span> },
    { key: 'txn_date',     label: 'Date',      render: r => formatDateTime(r.txn_date) },
    { key: 'trace',        label: 'Trace',      render: r => `${r.batch_no || '—'}${r.serial_no ? ` / ${r.serial_no}` : ''}` },
    { key: 'notes',        label: 'Notes',     render: r => <span className="text-gray-500 text-xs">{r.notes || '—'}</span> },
  ];

  const lowStockCols = [
    { key: 'sku',           label: 'SKU',      render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.sku}</span> },
    { key: 'name',          label: 'Product',  render: r => <span className="font-medium">{r.name}</span> },
    { key: 'category_name', label: 'Category' },
    { key: 'total_stock',   label: 'In Stock', render: r => <span className="font-bold text-red-600">{r.total_stock}</span> },
    { key: 'reorder_level', label: 'Min Level' },
    { key: 'shortage',      label: 'Shortage', render: r => <span className="font-bold text-orange-600">-{r.shortage}</span> },
    { key: 'preferred_supplier', label: 'Supplier', render: r => r.preferred_supplier || '—' },
    { key: 'reorder_qty',   label: 'Order Qty', render: r => <Badge className="bg-blue-100 text-blue-800">{r.reorder_qty}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and adjust inventory levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={ArrowLeftRight} onClick={() => { setXfrErr(''); setXfrModal(true); }}>
            Transfer
          </Button>
          <Button icon={SlidersHorizontal} onClick={() => { setAdjErr(''); setAdjModal(true); }}>
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); reset(); }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
              ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'Low Stock' && lowStock.length > 0
              ? <span className="flex items-center gap-1.5">{t} <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{lowStock.length}</span></span>
              : t}
          </button>
        ))}
        <button onClick={loadTab} className="ml-auto mb-1 p-1 text-gray-400 hover:text-gray-700">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <Card padding={false}>
        {tab === 'Levels' && (
          <>
            <Table columns={levelCols} data={levels?.data} loading={loading && !levels} />
            {levels && <div className="p-4"><Pagination page={page} totalPages={levels.totalPages} total={levels.total} limit={limit} onPage={setPage} /></div>}
          </>
        )}
        {tab === 'Transactions' && (
          <>
            <Table columns={txnCols} data={transactions?.data} loading={loading && !transactions} />
            {transactions && <div className="p-4"><Pagination page={page} totalPages={transactions.totalPages} total={transactions.total} limit={limit} onPage={setPage} /></div>}
          </>
        )}
        {tab === 'Low Stock' && (
          <Table columns={lowStockCols} data={lowStock} loading={loading} emptyMessage="All products are sufficiently stocked 🎉" />
        )}
      </Card>

      {/* Adjust Modal */}
      <Modal open={adjModal} onClose={() => setAdjModal(false)} title="Manual Stock Adjustment">
        <div className="space-y-4">
          {adjErr && <Alert message={adjErr} />}
          <Select label="Product" required value={adjForm.product_id} onChange={e => setAdjForm({...adjForm, product_id: e.target.value})}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} ({p.sku})</option>)}
          </Select>
          <Select label="Warehouse" required value={adjForm.warehouse_id} onChange={e => setAdjForm({...adjForm, warehouse_id: e.target.value})}>
            <option value="">Select warehouse…</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
          </Select>
          <Select label="Transaction Type" required value={adjForm.txn_type} onChange={e => setAdjForm({...adjForm, txn_type: e.target.value})}>
            {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input label="Quantity" required type="number" min="1" value={adjForm.quantity} onChange={e => setAdjForm({...adjForm, quantity: e.target.value})} />
          <Input label="Notes" value={adjForm.notes} onChange={e => setAdjForm({...adjForm, notes: e.target.value})} placeholder="Reason for adjustment…" />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setAdjModal(false)}>Cancel</Button>
            <Button onClick={handleAdjust} loading={saving}>Record Adjustment</Button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal open={xfrModal} onClose={() => setXfrModal(false)} title="Warehouse Transfer">
        <div className="space-y-4">
          {xfrErr && <Alert message={xfrErr} />}
          <Select label="Product" required value={xfrForm.product_id} onChange={e => setXfrForm({...xfrForm, product_id: e.target.value})}>
            <option value="">Select product…</option>
            {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} ({p.sku})</option>)}
          </Select>
          <Select label="From Warehouse" required value={xfrForm.from_warehouse_id} onChange={e => setXfrForm({...xfrForm, from_warehouse_id: e.target.value})}>
            <option value="">Select source…</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
          </Select>
          <Select label="To Warehouse" required value={xfrForm.to_warehouse_id} onChange={e => setXfrForm({...xfrForm, to_warehouse_id: e.target.value})}>
            <option value="">Select destination…</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
          </Select>
          <Input label="Quantity" required type="number" min="1" value={xfrForm.quantity} onChange={e => setXfrForm({...xfrForm, quantity: e.target.value})} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setXfrModal(false)}>Cancel</Button>
            <Button onClick={handleTransfer} loading={saving}>Transfer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
