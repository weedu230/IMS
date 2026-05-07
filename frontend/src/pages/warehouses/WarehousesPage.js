import React, { useState, useEffect, useCallback } from 'react';
import { warehouseAPI } from '../../api';
import { Card, Table, Button, Badge, Modal, Input, Pagination, Alert } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import { usePagination } from '../../hooks/useApi';
import { Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { warehouse_name:'', location:'', capacity:0 };

export default function WarehousesPage() {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const { page, limit, setPage } = usePagination(20);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await warehouseAPI.getAll({ page, limit }); setItems(r.data.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const open = (w) => {
    setEditing(w || null);
    setForm(w ? { warehouse_name:w.warehouse_name, location:w.location, capacity:w.capacity } : EMPTY);
    setErr(''); setModal(true);
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      editing ? await warehouseAPI.update(editing.warehouse_id, form) : await warehouseAPI.create(form);
      toast.success(editing ? 'Warehouse updated' : 'Warehouse created');
      setModal(false); load();
    } catch(e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const columns = [
    { key:'warehouse_name', label:'Name',     render:r => <span className="font-medium">{r.warehouse_name}</span> },
    { key:'location',       label:'Location' },
    { key:'capacity',       label:'Capacity', render:r => r.capacity.toLocaleString() + ' units' },
    { key:'is_active',      label:'Status',   render:r => <Badge className={r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key:'actions', label:'', render:r => <Button variant="ghost" size="sm" icon={Edit2} onClick={() => open(r)} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Warehouses</h1><p className="text-sm text-gray-500 mt-1">Manage storage locations</p></div>
        <Button icon={Plus} onClick={() => open(null)}>New Warehouse</Button>
      </div>
      <Card padding={false}>
        <Table columns={columns} data={items?.data} loading={loading && !items} />
        {items && <div className="p-4"><Pagination page={page} totalPages={items.totalPages} total={items.total} limit={limit} onPage={setPage} /></div>}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Warehouse' : 'New Warehouse'}>
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <Input label="Warehouse Name" required value={form.warehouse_name} onChange={e => setForm({...form, warehouse_name:e.target.value})} />
          <Input label="Location" required value={form.location} onChange={e => setForm({...form, location:e.target.value})} />
          <Input label="Capacity (units)" type="number" min="0" value={form.capacity} onChange={e => setForm({...form, capacity:e.target.value})} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
