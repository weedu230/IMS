import React, { useState, useEffect, useCallback } from 'react';
import { employeeAPI, authAPI, warehouseAPI } from '../../api';
import { Card, Table, Button, Badge, Modal, Input, Select, Pagination, Alert, SearchBar } from '../../components/ui';
import { formatDateTime, getErrorMessage } from '../../utils/helpers';
import { usePagination, useDebounce } from '../../hooks/useApi';
import { Plus, Edit2, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['admin','manager','staff','viewer'];

export default function EmployeesPage() {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [regModal,  setRegModal]  = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ role:'staff' });
  const [regForm, setRegForm]  = useState({ name:'', email:'', password:'', role:'staff', warehouse_id:'' });
  const [resetForm, setResetForm] = useState({ new_password: '' });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const [search,  setSearch]  = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const { page, limit, setPage } = usePagination(20);
  const q = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await employeeAPI.getAll({ page, limit, search: q }); setItems(r.data.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, limit, q]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    warehouseAPI.getAll({ limit: 50 }).then(r => setWarehouses(r.data.data?.data || []));
  }, []);

  const openEdit = (e) => {
    setEditing(e);
    setEditForm({ role: e.role, warehouse_id: e.warehouse_id || '' });
    setErr(''); setEditModal(true);
  };

  const saveEdit = async () => {
    setSaving(true); setErr('');
    try {
      await employeeAPI.update(editing.emp_id, editForm);
      toast.success('Employee updated'); setEditModal(false); load();
    } catch(e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const openReset = (e) => {
    setEditing(e);
    setResetForm({ new_password: '' });
    setErr('');
    setResetModal(true);
  };

  const resetPassword = async () => {
    setSaving(true); setErr('');
    try {
      await employeeAPI.resetPassword(editing.emp_id, resetForm.new_password);
      toast.success(`Password reset for ${editing.name}`);
      setResetModal(false);
      setResetForm({ new_password: '' });
      load();
    } catch(e) {
      if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
        const msg = e.response.data.errors.map(err => `${err.field}: ${err.message}`).join('; ');
        setErr(msg);
      } else {
        setErr(getErrorMessage(e));
      }
    }
    finally { setSaving(false); }
  };

  const register = async () => {
    setSaving(true); setErr('');
    try {
      const payload = { ...regForm, warehouse_id: regForm.warehouse_id ? parseInt(regForm.warehouse_id) : null };
      await authAPI.register(payload);
      toast.success('Employee registered'); setRegModal(false);
      setRegForm({ name:'', email:'', password:'', role:'staff', warehouse_id:'' });
      load();
    } catch(e) {
      // Format validation errors to show specific field failures
      if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
        const msg = e.response.data.errors.map(err => `${err.field}: ${err.message}`).join('; ');
        setErr(msg);
      } else {
        setErr(getErrorMessage(e));
      }
    }
    finally { setSaving(false); }
  };

  const columns = [
    { key:'name',       label:'Name',       render:r => <span className="font-medium">{r.name}</span> },
    { key:'email',      label:'Email' },
    { key:'role',       label:'Role',       render:r => <Badge className="bg-indigo-100 text-indigo-800 capitalize">{r.role}</Badge> },
    { key:'warehouse',  label:'Warehouse',  render:r => r.warehouse?.warehouse_name || '—' },
    { key:'is_active',  label:'Status',     render:r => <Badge className={r.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key:'last_login', label:'Last Login', render:r => formatDateTime(r.last_login) },
    { key:'actions',    label:'',           render:r => <div className="flex gap-2"><Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(r)} /><Button variant="ghost" size="sm" icon={Key} onClick={() => openReset(r)} title="Reset Password" /></div> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Employees</h1><p className="text-sm text-gray-500 mt-1">Manage system users and roles</p></div>
        <Button icon={Plus} onClick={() => { setErr(''); setRegModal(true); }}>Register Employee</Button>
      </div>
      <Card padding={false}>
        <div className="p-4 border-b"><SearchBar value={search} onChange={setSearch} /></div>
        <Table columns={columns} data={items?.data} loading={loading && !items} />
        {items && <div className="p-4"><Pagination page={page} totalPages={items.totalPages} total={items.total} limit={limit} onPage={setPage} /></div>}
      </Card>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Employee">
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-900">{editing?.name}</p>
            <p className="text-gray-500">{editing?.email}</p>
          </div>
          <Select label="Role" value={editForm.role} onChange={e => setEditForm({...editForm, role:e.target.value})}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={saveEdit} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <Modal open={regModal} onClose={() => setRegModal(false)} title="Register New Employee">
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <Input label="Full Name" required value={regForm.name} onChange={e => setRegForm({...regForm, name:e.target.value})} />
          <Input label="Email" type="email" required value={regForm.email} onChange={e => setRegForm({...regForm, email:e.target.value})} />
          <Input label="Password" type="password" required value={regForm.password}
            onChange={e => setRegForm({...regForm, password:e.target.value})}
            placeholder="Min 8 chars, 1 uppercase, 1 number" />
          <Select label="Role" value={regForm.role} onChange={e => setRegForm({...regForm, role:e.target.value})}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Select label="Warehouse (Optional)" value={regForm.warehouse_id} onChange={e => setRegForm({...regForm, warehouse_id:e.target.value})}>
            <option value="">— No warehouse assigned —</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setRegModal(false)}>Cancel</Button>
            <Button onClick={register} loading={saving}>Register</Button>
          </div>
        </div>
      </Modal>

      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset Employee Password">
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <p className="font-medium text-blue-900">Resetting password for: {editing?.name}</p>
            <p className="text-blue-700 text-xs mt-1">Email: {editing?.email}</p>
          </div>
          <Input
            label="New Password"
            type="password"
            required
            value={resetForm.new_password}
            onChange={e => setResetForm({ new_password: e.target.value })}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setResetModal(false)}>Cancel</Button>
            <Button onClick={resetPassword} loading={saving}>Reset Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
