import React, { useState, useEffect, useCallback } from 'react';
import { supplierAPI } from '../../api';
import { Card, Table, Button, Badge, Modal, Input, Pagination, Alert, SearchBar } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import { usePagination, useDebounce } from '../../hooks/useApi';
import { Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { company_name:'', contact_person:'', email:'', phone:'', address:'', lead_time_days:7 };

export default function SuppliersPage() {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [search,  setSearch]  = useState('');
  const { page, limit, setPage } = usePagination(20);
  const q = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await supplierAPI.getAll({ page, limit, search: q }); setItems(r.data.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const open = (s) => {
    setEditing(s || null);
    setForm(s ? { company_name:s.company_name, contact_person:s.contact_person||'', email:s.email||'', phone:s.phone||'', address:s.address||'', lead_time_days:s.lead_time_days } : EMPTY);
    setErr(''); setModal(true);
  };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      editing ? await supplierAPI.update(editing.supplier_id, form) : await supplierAPI.create(form);
      toast.success(editing ? 'Supplier updated' : 'Supplier created');
      setModal(false); load();
    } catch(e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const columns = [
    { key:'company_name',   label:'Company',   render:r => <span className="font-medium">{r.company_name}</span> },
    { key:'contact_person', label:'Contact' },
    { key:'email',          label:'Email' },
    { key:'phone',          label:'Phone' },
    { key:'lead_time_days', label:'Lead Time', render:r => `${r.lead_time_days} days` },
    { key:'is_active',      label:'Status',    render:r => <Badge className={r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key:'actions', label:'', render:r => <Button variant="ghost" size="sm" icon={Edit2} onClick={() => open(r)} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Suppliers</h1><p className="text-sm text-gray-500 mt-1">Manage your vendor relationships</p></div>
        <Button icon={Plus} onClick={() => open(null)}>New Supplier</Button>
      </div>
      <Card padding={false}>
        <div className="p-4 border-b"><SearchBar value={search} onChange={setSearch} placeholder="Search suppliers…" /></div>
        <Table columns={columns} data={items?.data} loading={loading && !items} />
        {items && <div className="p-4"><Pagination page={page} totalPages={items.totalPages} total={items.total} limit={limit} onPage={setPage} /></div>}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}>
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <Input label="Company Name" required value={form.company_name} onChange={e => setForm({...form, company_name:e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" value={form.contact_person} onChange={e => setForm({...form, contact_person:e.target.value})} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
            <Input label="Lead Time (days)" type="number" min="0" value={form.lead_time_days} onChange={e => setForm({...form, lead_time_days:e.target.value})} />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm({...form, address:e.target.value})} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
