import React, { useState, useEffect } from 'react';
import { productAPI, categoryAPI } from '../../api';
import {
  Card, Table, Button, Badge, Modal,
  Input, Select, SearchBar, Pagination, Alert, Spinner,
} from '../../components/ui';
import { formatCurrency, getErrorMessage } from '../../utils/helpers';
import { useDebounce, usePagination } from '../../hooks/useApi';
import { Plus, Edit2, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { name:'', sku:'', category_id:'', unit_price:'', reorder_level:10, reorder_qty:50 };

export default function ProductsPage() {
  const [products,   setProducts]   = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [formErr,    setFormErr]    = useState('');

  const { page, limit, setPage } = usePagination(20);
  const q = useDebounce(search, 400);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ page, limit, search: q });
      setProducts(res.data.data);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, limit, q]);

  React.useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryAPI.getAll({ limit: 100 }).then(r => setCategories(r.data.data?.data || []));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setModal(true); };
  const openEdit   = (p)  => { setEditing(p); setForm({ name: p.name, sku: p.sku, category_id: p.category_id || '', unit_price: p.unit_price, reorder_level: p.reorder_level, reorder_qty: p.reorder_qty }); setFormErr(''); setModal(true); };

  const handleSave = async () => {
    setSaving(true); setFormErr('');
    try {
      if (editing) {
        await productAPI.update(editing.product_id, form);
        toast.success('Product updated');
      } else {
        await productAPI.create(form);
        toast.success('Product created');
      }
      setModal(false); load();
    } catch (e) { setFormErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    try {
      await productAPI.deactivate(p.product_id);
      toast.success('Product deactivated');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const columns = [
    { key: 'sku',   label: 'SKU', render: r => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.sku}</span> },
    { key: 'name',  label: 'Name', render: r => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'category', label: 'Category', render: r => r.category?.category_name || '—' },
    { key: 'unit_price', label: 'Price', render: r => formatCurrency(r.unit_price) },
    { key: 'reorder_level', label: 'Reorder At' },
    { key: 'is_active', label: 'Status', render: r => (
      <Badge className={r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
        {r.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'actions', label: '', render: r => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(r)} />
        {r.is_active && <Button variant="ghost" size="sm" icon={PowerOff} onClick={() => handleDeactivate(r)} className="text-red-500 hover:bg-red-50" />}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>New Product</Button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name or SKU…" />
          {loading && <Spinner />}
        </div>
        {error && <Alert message={error} className="m-4" />}
        <Table columns={columns} data={products?.data} loading={loading && !products} />
        {products && (
          <div className="p-4">
            <Pagination page={page} totalPages={products.totalPages} total={products.total}
              limit={limit} onPage={setPage} />
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Edit Product' : 'New Product'}>
        <div className="space-y-4">
          {formErr && <Alert message={formErr} />}
          <Input label="Product Name" required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="SKU" required value={form.sku}
            onChange={e => setForm({ ...form, sku: e.target.value })}
            disabled={!!editing} />
          <Select label="Category" value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— No category —</option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </Select>
          <Input label="Unit Price (PKR)" required type="number" min="0" step="0.01"
            value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Reorder Level" type="number" min="0"
              value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} />
            <Input label="Reorder Qty" type="number" min="0"
              value={form.reorder_qty} onChange={e => setForm({ ...form, reorder_qty: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Create Product'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
