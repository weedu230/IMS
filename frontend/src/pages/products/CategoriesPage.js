import React, { useState, useEffect, useCallback } from 'react';
import { categoryAPI } from '../../api';
import { Card, Table, Button, Modal, Input, Select, Pagination, Alert } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import { usePagination } from '../../hooks/useApi';
import { Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ category_name:'', description:'', parent_id:'' });
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  const { page, limit, setPage } = usePagination(20);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await categoryAPI.getAll({ page, limit }); setItems(r.data.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const open = (c) => { setEditing(c||null); setForm(c?{category_name:c.category_name,description:c.description||'',parent_id:c.parent_id||''}:{category_name:'',description:'',parent_id:''}); setErr(''); setModal(true); };

  const save = async () => {
    setSaving(true); setErr('');
    try {
      editing ? await categoryAPI.update(editing.category_id, form) : await categoryAPI.create(form);
      toast.success(editing?'Updated':'Created'); setModal(false); load();
    } catch(e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const allCats = items?.data || [];
  const columns = [
    { key:'category_name', label:'Name', render:r=><span className="font-medium">{r.category_name}</span> },
    { key:'parent',        label:'Parent', render:r=>r.parentCategory?.category_name||'—' },
    { key:'description',   label:'Description', render:r=><span className="text-gray-500 text-xs">{r.description||'—'}</span> },
    { key:'sub',           label:'Sub-categories', render:r=>r.subCategories?.length||0 },
    { key:'actions', label:'', render:r=><Button variant="ghost" size="sm" icon={Edit2} onClick={()=>open(r)} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button icon={Plus} onClick={()=>open(null)}>New Category</Button>
      </div>
      <Card padding={false}>
        <Table columns={columns} data={items?.data} loading={loading && !items} />
        {items && <div className="p-4"><Pagination page={page} totalPages={items.totalPages} total={items.total} limit={limit} onPage={setPage} /></div>}
      </Card>
      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Edit Category':'New Category'}>
        <div className="space-y-4">
          {err && <Alert message={err} />}
          <Input label="Category Name" required value={form.category_name} onChange={e=>setForm({...form,category_name:e.target.value})} />
          <Input label="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <Select label="Parent Category" value={form.parent_id} onChange={e=>setForm({...form,parent_id:e.target.value})}>
            <option value="">— Root category —</option>
            {allCats.filter(c=>!editing||c.category_id!==editing.category_id).map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing?'Save':'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
