import React, { useState, useEffect, useCallback } from 'react';
import { poAPI, supplierAPI, productAPI, warehouseAPI } from '../../api';
import {
  Card, Table, Button, Badge, Modal, Input, Select,
  Pagination, Alert,
} from '../../components/ui';
import { formatCurrency, formatDate, statusColor, getErrorMessage } from '../../utils/helpers';
import { usePagination } from '../../hooks/useApi';
import { Plus, Eye, CheckCircle, Send, XCircle, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PurchaseOrdersPage() {
  const [orders,     setOrders]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [suppliers,  setSuppliers]  = useState([]);
  const [products,   setProducts]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [poForm, setPoForm] = useState({ supplier_id:'', expected_date:'', notes:'', items:[] });
  const [createErr, setCreateErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail / receive modal
  const [detailModal, setDetailModal] = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [receiveForm, setReceiveForm] = useState([]);
  const [receiveMode, setReceiveMode] = useState(false);

  const { page, limit, setPage } = usePagination(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await poAPI.getAll({ page, limit });
      setOrders(r.data.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supplierAPI.getAll({ limit:100 }).then(r => setSuppliers(r.data.data?.data || []));
    productAPI.getAll({ limit:200 }).then(r => setProducts(r.data.data?.data || []));
    warehouseAPI.getAll({ limit:50 }).then(r => setWarehouses(r.data.data?.data || []));
  }, []);

  const openDetail = async (po) => {
    const r = await poAPI.getById(po.po_id);
    setSelected(r.data.data);
    setReceiveForm((r.data.data.items || []).map(i => ({ po_item_id: i.po_item_id, qty_received: i.qty_ordered - i.qty_received })));
    setReceiveMode(false);
    setDetailModal(true);
  };

  const addItem = () => setPoForm(f => ({ ...f, items: [...f.items, { product_id:'', warehouse_id:'', qty_ordered:1, unit_cost:0 }] }));
  const removeItem = (i) => setPoForm(f => ({ ...f, items: f.items.filter((_,idx)=>idx!==i) }));
  const updateItem = (i, field, val) => setPoForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const handleCreate = async () => {
    if (!poForm.supplier_id) { setCreateErr('Select a supplier'); return; }
    if (poForm.items.length === 0) { setCreateErr('Add at least one item'); return; }
    setSaving(true); setCreateErr('');
    try {
      await poAPI.create({ ...poForm, items: poForm.items.map(i => ({ ...i, qty_ordered: parseInt(i.qty_ordered), unit_cost: parseFloat(i.unit_cost) })) });
      toast.success('Purchase order created');
      setCreateModal(false);
      setPoForm({ supplier_id:'', expected_date:'', notes:'', items:[] });
      load();
    } catch (e) { setCreateErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const action = async (fn, successMsg) => {
    try { await fn(); toast.success(successMsg); load(); setDetailModal(false); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleReceive = async () => {
    try {
      await poAPI.receiveGoods(selected.po_id, { items: receiveForm.map(i => ({ ...i, qty_received: parseInt(i.qty_received) })).filter(i => i.qty_received > 0) });
      toast.success('Goods received');
      setDetailModal(false);
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const columns = [
    { key: 'po_id',      label: 'PO #', render: r => <span className="font-mono font-bold">#{r.po_id}</span> },
    { key: 'supplier',   label: 'Supplier', render: r => r.supplier?.company_name },
    { key: 'order_date', label: 'Date', render: r => formatDate(r.order_date) },
    { key: 'expected_date', label: 'Expected', render: r => formatDate(r.expected_date) },
    { key: 'total_amount', label: 'Total', render: r => formatCurrency(r.total_amount) },
    { key: 'status', label: 'Status', render: r => <Badge className={statusColor(r.status)}>{r.status.replace('_',' ')}</Badge> },
    { key: 'actions', label: '', render: r => (
      <Button variant="ghost" size="sm" icon={Eye} onClick={() => openDetail(r)} />
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage procurement workflow</p></div>
        <Button icon={Plus} onClick={() => { setCreateErr(''); setCreateModal(true); }}>New PO</Button>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={orders?.data} loading={loading && !orders} />
        {orders && <div className="p-4"><Pagination page={page} totalPages={orders.totalPages} total={orders.total} limit={limit} onPage={setPage} /></div>}
      </Card>

      {/* Create PO Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Purchase Order" size="lg">
        <div className="space-y-4">
          {createErr && <Alert message={createErr} />}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Supplier" required value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.company_name}</option>)}
            </Select>
            <Input label="Expected Date" type="date" value={poForm.expected_date} onChange={e => setPoForm({...poForm, expected_date: e.target.value})} />
          </div>
          <Input label="Notes" value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>Add Item</Button>
            </div>
            {poForm.items.length === 0 && <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">No items yet. Click "Add Item".</p>}
            {poForm.items.map((item, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2 p-3 border rounded-lg bg-gray-50">
                <Select value={item.product_id} onChange={e => updateItem(i,'product_id',e.target.value)}>
                  <option value="">Product…</option>
                  {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                </Select>
                <Select value={item.warehouse_id} onChange={e => updateItem(i,'warehouse_id',e.target.value)}>
                  <option value="">Warehouse…</option>
                  {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
                </Select>
                <Input type="number" min="1" placeholder="Qty" value={item.qty_ordered} onChange={e => updateItem(i,'qty_ordered',e.target.value)} />
                <div className="flex gap-1">
                  <Input type="number" min="0" step="0.01" placeholder="Cost" value={item.unit_cost} onChange={e => updateItem(i,'unit_cost',e.target.value)} />
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">×</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving}>Create PO</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selected && (
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title={`PO #${selected.po_id}`} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Supplier: </span><span className="font-medium">{selected.supplier?.company_name}</span></div>
              <div><span className="text-gray-500">Status: </span><Badge className={statusColor(selected.status)}>{selected.status}</Badge></div>
              <div><span className="text-gray-500">Order Date: </span>{formatDate(selected.order_date)}</div>
              <div><span className="text-gray-500">Expected: </span>{formatDate(selected.expected_date)}</div>
              <div><span className="text-gray-500">Total: </span><span className="font-bold">{formatCurrency(selected.total_amount)}</span></div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead><tr className="bg-gray-50">
                {['Product','Warehouse','Ordered','Received','Cost'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
                {receiveMode && <th className="px-3 py-2">Receive Now</th>}
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {(selected.items || []).map((item, i) => (
                  <tr key={item.po_item_id}>
                    <td className="px-3 py-2">{item.product?.name}</td>
                    <td className="px-3 py-2">{item.warehouse?.warehouse_name}</td>
                    <td className="px-3 py-2">{item.qty_ordered}</td>
                    <td className="px-3 py-2 font-medium text-green-600">{item.qty_received}</td>
                    <td className="px-3 py-2">{formatCurrency(item.unit_cost)}</td>
                    {receiveMode && (
                      <td className="px-3 py-2">
                        <Input type="number" min="0" max={item.qty_ordered - item.qty_received}
                          className="w-20"
                          value={receiveForm[i]?.qty_received || 0}
                          onChange={e => {
                            const f = [...receiveForm];
                            f[i] = { ...f[i], qty_received: parseInt(e.target.value)||0 };
                            setReceiveForm(f);
                          }} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Action buttons based on status */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {selected.status === 'draft' && (
                <Button icon={Send} size="sm" onClick={() => action(() => poAPI.submit(selected.po_id), 'Submitted for approval')}>Submit</Button>
              )}
              {selected.status === 'pending_approval' && (
                <Button icon={CheckCircle} size="sm" variant="success" onClick={() => action(() => poAPI.approve(selected.po_id), 'PO Approved')}>Approve</Button>
              )}
              {['approved','partially_received'].includes(selected.status) && !receiveMode && (
                <Button icon={PackageCheck} size="sm" onClick={() => setReceiveMode(true)}>Receive Goods</Button>
              )}
              {receiveMode && (
                <>
                  <Button size="sm" onClick={handleReceive}>Confirm Receipt</Button>
                  <Button size="sm" variant="secondary" onClick={() => setReceiveMode(false)}>Cancel</Button>
                </>
              )}
              {['draft','pending_approval','approved'].includes(selected.status) && (
                <Button icon={XCircle} size="sm" variant="danger" onClick={() => action(() => poAPI.cancel(selected.po_id), 'PO Cancelled')}>Cancel PO</Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
