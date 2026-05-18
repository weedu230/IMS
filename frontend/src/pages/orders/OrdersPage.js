import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI, customerAPI, productAPI, warehouseAPI } from '../../api';
import {
  Card, Table, Button, Badge, Modal, Input,
  Select, Pagination, Alert, SearchBar,
} from '../../components/ui';
import { formatCurrency, formatDate, statusColor, getErrorMessage } from '../../utils/helpers';
import { usePagination, useDebounce } from '../../hooks/useApi';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders,     setOrders]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [customers,  setCustomers]  = useState([]);
  const [products,   setProducts]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modal,      setModal]      = useState(false);
  const [detail,     setDetail]     = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form,       setForm]       = useState({ customer_id:'', shipping_address:'', notes:'', items:[] });
  const [err,        setErr]        = useState('');
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const { page, limit, setPage } = usePagination(20);
  const q = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await orderAPI.getAll({ page, limit, search: q });
      setOrders(r.data.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, limit, q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    customerAPI.getAll({ limit: 100 }).then(r => setCustomers(r.data.data?.data || []));
    productAPI.getAll({ limit: 200 }).then(r => setProducts(r.data.data?.data || []));
    warehouseAPI.getAll({ limit: 50 }).then(r => setWarehouses(r.data.data?.data || []));
  }, []);

  const openDetail = async (o) => {
    try {
      const r = await orderAPI.getById(o.order_id);
      setDetail(r.data.data);
      setDetailOpen(true);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { product_id:'', warehouse_id:'', qty_ordered:1, unit_price:0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    // Auto-fill unit_price from product selection
    if (field === 'product_id') {
      const product = products.find(p => p.product_id === parseInt(val));
      if (product) items[i].unit_price = product.unit_price;
    }
    return { ...f, items };
  });

  const handleCreate = async () => {
    if (!form.customer_id)     { setErr('Please select a customer'); return; }
    if (form.items.length === 0) { setErr('Add at least one item'); return; }
    setSaving(true); setErr('');
    try {
      await orderAPI.create({
        ...form,
        items: form.items.map(i => ({
          ...i,
          qty_ordered: parseInt(i.qty_ordered),
          unit_price:  parseFloat(i.unit_price),
        })),
      });
      toast.success('Order placed successfully');
      setModal(false);
      setForm({ customer_id:'', shipping_address:'', notes:'', items:[] });
      load();
    } catch (e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const action = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      setDetailOpen(false);
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const columns = [
    { key:'order_id',     label:'Order #',  render:r => <span className="font-mono font-bold text-indigo-600">#{r.order_id}</span> },
    { key:'customer',     label:'Customer', render:r => r.customer?.name || '—' },
    { key:'order_date',   label:'Date',     render:r => formatDate(r.order_date) },
    { key:'total_amount', label:'Total',    render:r => <span className="font-semibold">{formatCurrency(r.total_amount)}</span> },
    { key:'status',       label:'Status',   render:r => <Badge className={statusColor(r.status)}>{r.status}</Badge> },
    { key:'actions',      label:'',         render:r => (
      <Button variant="ghost" size="sm" icon={Eye} onClick={() => openDetail(r)} />
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track and fulfill customer orders</p>
        </div>
        <Button icon={Plus} onClick={() => { setErr(''); setModal(true); }}>New Order</Button>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="p-4 border-b">
          <SearchBar value={search} onChange={setSearch} placeholder="Search orders…" />
        </div>
        <Table columns={columns} data={orders?.data} loading={loading && !orders} />
        {orders && (
          <div className="p-4">
            <Pagination page={page} totalPages={orders.totalPages}
              total={orders.total} limit={limit} onPage={setPage} />
          </div>
        )}
      </Card>

      {/* Create Order Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Sales Order" size="lg">
        <div className="space-y-4">
          {err && <Alert message={err} />}

          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer" required value={form.customer_id}
              onChange={e => setForm({...form, customer_id: e.target.value})}>
              <option value="">Select customer…</option>
              {customers.map(c => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} (Limit: {formatCurrency(c.credit_limit)})
                </option>
              ))}
            </Select>
            <Input label="Shipping Address" value={form.shipping_address}
              onChange={e => setForm({...form, shipping_address: e.target.value})} />
          </div>

          <Input label="Notes" value={form.notes}
            onChange={e => setForm({...form, notes: e.target.value})} />

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Order Items</label>
              <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>Add Item</Button>
            </div>

            {form.items.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                No items yet. Click "Add Item" to begin.
              </p>
            )}

            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 border rounded-lg bg-gray-50">
                <Select value={item.product_id}
                  onChange={e => updateItem(i, 'product_id', e.target.value)}>
                  <option value="">Product…</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.name}</option>
                  ))}
                </Select>
                <Select value={item.warehouse_id}
                  onChange={e => updateItem(i, 'warehouse_id', e.target.value)}>
                  <option value="">Warehouse…</option>
                  {warehouses.map(w => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>
                  ))}
                </Select>
                <Input type="number" min="1" placeholder="Qty"
                  value={item.qty_ordered}
                  onChange={e => updateItem(i, 'qty_ordered', e.target.value)} />
                <div className="flex gap-1 items-center">
                  <Input type="number" min="0" step="0.01" placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)} />
                  <button onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 text-lg font-bold px-1">×</button>
                </div>
              </div>
            ))}

            {/* Running total */}
            {form.items.length > 0 && (
              <div className="text-right text-sm font-semibold text-gray-700 mt-2">
                Total: {formatCurrency(
                  form.items.reduce((s, i) => s + (parseFloat(i.unit_price)||0) * (parseInt(i.qty_ordered)||0), 0)
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Place Order</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {detail && (
        <Modal open={detailOpen} onClose={() => setDetailOpen(false)}
          title={`Order #${detail.order_id}`} size="lg">
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg text-sm">
              <div><span className="text-gray-500">Customer: </span>
                <span className="font-medium">{detail.customer?.name}</span></div>
              <div><span className="text-gray-500">Status: </span>
                <Badge className={statusColor(detail.status)}>{detail.status}</Badge></div>
              <div><span className="text-gray-500">Date: </span>{formatDate(detail.order_date)}</div>
              <div><span className="text-gray-500">Total: </span>
                <span className="font-bold text-indigo-600">{formatCurrency(detail.total_amount)}</span></div>
              {detail.shipping_address && (
                <div className="col-span-2"><span className="text-gray-500">Ship to: </span>{detail.shipping_address}</div>
              )}
            </div>

            {/* Items */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['Product','Warehouse','Ordered','Reserved','Shipped','Unit Price','Subtotal'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(detail.items || []).map(item => (
                  <tr key={item.item_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{item.product?.name}</td>
                    <td className="px-3 py-2 text-gray-500">{item.warehouse?.warehouse_name}</td>
                    <td className="px-3 py-2">{item.qty_ordered}</td>
                    <td className="px-3 py-2 text-blue-600">{item.qty_reserved}</td>
                    <td className="px-3 py-2 text-green-600">{item.qty_shipped}</td>
                    <td className="px-3 py-2">{formatCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 font-semibold">{formatCurrency(item.unit_price * item.qty_ordered)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Workflow actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              {['confirmed','picking','packed'].includes(detail.status) && (
                <Button icon={CheckCircle} size="sm" variant="success"
                  onClick={() => action(() => orderAPI.fulfill(detail.order_id), 'Order fulfilled successfully')}>
                  Mark Fulfilled
                </Button>
              )}
              {!['picking','packed'].includes(detail.status) && (
                <Button variant="secondary" size="sm"
                  onClick={() => action(() => orderAPI.updateStatus(detail.order_id, 'picking'), 'Status updated')}>
                  → Picking
                </Button>
              )}
              {['pending','confirmed'].includes(detail.status) && (
                <Button icon={XCircle} size="sm" variant="danger"
                  onClick={() => action(() => orderAPI.cancel(detail.order_id), 'Order cancelled')}>
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
