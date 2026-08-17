import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, Globe, X, Check, Loader, Layers } from 'lucide-react';
import { api } from '../../api';
import { viaLabel } from '../../utils/via';
import Pagination from '../../components/ui/Pagination';

interface BulkRouteRow {
  origin: string;
  destination: string;
  via: string;
  price: string;
  estimatedDuration: string;
}

export default function AgencyRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRouteRow[]>([
    { origin: '', destination: '', via: '', price: '', estimatedDuration: '' },
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: number } | null>(null);

  const [form, setForm] = useState({
    agencyId: '', type: 'east_africa', origin: '', destination: '',
    via: '', price: '', provinces: [] as string[],
    estimatedDuration: '',
  });

  useEffect(() => {
    loadRoutes();
    loadAgencies();
    loadProvinces();
  }, []);

  useEffect(() => { loadRoutes(); }, [page]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = await api.getRoutes({ page: String(page), limit: '20' });
      setRoutes(res.data?.routes || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
    } catch { }
    setLoading(false);
  };

  const loadAgencies = async () => {
    try {
      const res = await api.getAgencies();
      setAgencies(res.data?.agencies || []);
    } catch { }
  };

  const loadProvinces = async () => {
    try {
      const res = await api.getProvinces();
      setProvinces(res.data?.provinces || []);
    } catch { }
  };

  const openCreate = () => {
    setEditingRoute(null);
    setForm({ agencyId: '', type: 'east_africa', origin: '', destination: '', via: '', price: '', provinces: [], estimatedDuration: '' });
    setShowModal(true);
  };

  const openEdit = (route: any) => {
    setEditingRoute(route);
    setForm({
      agencyId: route.agency?._id || '',
      type: route.type,
      origin: route.origin,
      destination: route.destination,
      via: route.via || '',
      price: route.price.toString(),
      provinces: route.provinces || [],
      estimatedDuration: route.estimatedDuration || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.agencyId || !form.origin || !form.destination || !form.price) {
      setError('Agency, origin, destination, and price are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        agencyId: form.agencyId,
      };
      if (editingRoute) {
        await api.updateRoute(editingRoute._id, data);
      } else {
        await api.createRoute(data);
      }
      setShowModal(false);
      await loadRoutes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this route?')) return;
    try {
      await api.deleteRoute(id);
      await loadRoutes();
    } catch { }
  };

  const toggleProvince = (p: string) => {
    setForm(f => ({
      ...f,
      provinces: f.provinces.includes(p) ? f.provinces.filter(x => x !== p) : [...f.provinces, p],
    }));
  };

  const handleBulkSave = async () => {
    const valid = bulkRows.filter(r => r.origin && r.destination && r.price);
    if (valid.length === 0) { setBulkError('Add at least one route with origin, destination, and price.'); return; }
    setBulkSaving(true);
    setBulkError('');
    try {
      const agencyId = form.agencyId || (agencies.length === 1 ? agencies[0]._id : '');
      if (!agencyId) { setBulkError('Select an agency first.'); setBulkSaving(false); return; }
      const routesPayload = valid.map(r => ({
        agencyId,
        type: 'east_africa',
        origin: r.origin,
        destination: r.destination,
        via: r.via || undefined,
        price: parseFloat(r.price),
        estimatedDuration: r.estimatedDuration || undefined,
      }));
      const res = await api.createBulkRoutes({ routes: routesPayload });
      setBulkResult({ created: res.data?.created || 0, failed: res.data?.failed || 0 });
      await loadRoutes();
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkSaving(false);
    }
  };

  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { origin: '', destination: '', via: '', price: '', estimatedDuration: '' }]);
  };

  const updateBulkRow = (index: number, field: keyof BulkRouteRow, value: string) => {
    setBulkRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeBulkRow = (index: number) => {
    setBulkRows(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[var(--font-body)] text-2xl font-black text-[var(--text)] mb-1">Routes Management</h1>
          <p className="text-sm text-[var(--text-sub)]">Manage your bus routes and via points</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowBulkModal(true); setBulkRows([{ origin: '', destination: '', via: '', price: '', estimatedDuration: '' }]); setBulkResult(null); setBulkError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-[var(--border)] text-sm font-semibold text-[var(--text)] bg-white hover:border-[var(--blue)] transition-colors cursor-pointer"
          >
            <Layers size={14} /> Bulk Add
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--blue)] text-white text-sm font-semibold hover:bg-[var(--blue-dark)] transition-colors cursor-pointer border-none"
          >
            <Plus size={16} /> New Route
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader size={24} className="mx-auto animate-spin text-[var(--blue)]" /></div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-md border border-[var(--border)]">
          <MapPin size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text-sub)]">No routes yet</p>
          <button onClick={openCreate} className="text-xs text-[var(--blue)] mt-2 cursor-pointer bg-transparent border-none hover:underline">Create your first route</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map(route => (
            <motion.div key={route._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-md border border-[var(--border)] p-5 hover:border-[var(--blue)]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--blue-light)]">
                    <Globe size={18} className="text-[var(--blue)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">{route.origin} → {route.destination}<span className="text-[var(--text-muted)] font-medium">{viaLabel(route.via)}</span></p>
                    <p className="text-[11px] text-[var(--text-muted)]">East Africa · {route.agency?.name || 'Unknown'}</p>
                  </div>
                </div>
                <p className="font-black text-[var(--blue)]">{route.price?.toLocaleString()} RWF</p>
              </div>
              <div className="flex items-center gap-2 mb-2 text-[11px] text-[var(--text-sub)] flex-wrap">
                {route.via && <span className="flex items-center gap-1"><MapPin size={10} /> via {route.via}</span>}
                {route.estimatedDuration && <span>· {route.estimatedDuration}</span>}
              </div>
              <div className="flex gap-1 flex-wrap">
                {route.provinces?.slice(0, 3).map((p: string) => (
                  <span key={p} className="px-2 py-0.5 bg-[#F9FAFB] rounded text-[10px] text-[var(--text-sub)]">{p}</span>
                ))}
                {(route.provinces?.length || 0) > 3 && <span className="text-[10px] text-[var(--text-muted)]">+{route.provinces.length - 3}</span>}
              </div>
              <div className="flex gap-2 pt-3 mt-3 border-t border-[var(--border)]">
                <button onClick={() => openEdit(route)} className="text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--blue)] flex items-center gap-1 cursor-pointer bg-transparent border-none">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(route._id)} className="text-xs font-semibold text-[var(--text-sub)] hover:text-[var(--blue)] flex items-center gap-1 cursor-pointer bg-transparent border-none">
                  <Trash2 size={12} /> Deactivate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-md p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-[var(--font-body)] text-xl font-black text-[var(--text)]">{editingRoute ? 'Edit Route' : 'Create Route'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-sm hover:bg-[#F9FAFB] flex items-center justify-center cursor-pointer border-none bg-transparent"><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-4">
              {agencies.length > 0 && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Agency</label>
                  <select value={form.agencyId} onChange={e => setForm(f => ({ ...f, agencyId: e.target.value }))}
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)] bg-white"
                  >
                    <option value="">Select agency</option>
                    {agencies.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Origin</label>
                  <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                    placeholder="e.g. Kigali"
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Destination</label>
                  <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                    placeholder="e.g. Musanze"
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Price (RWF)</label>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    type="number" min="0" placeholder="5000"
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Est. Duration</label>
                  <input value={form.estimatedDuration} onChange={e => setForm(f => ({ ...f, estimatedDuration: e.target.value }))}
                    placeholder="e.g. 2 hours"
                    className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Operating Provinces</label>
                <div className="flex flex-wrap gap-2">
                  {provinces.map(p => (
                    <button key={p} onClick={() => toggleProvince(p)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer border ${
                        form.provinces.includes(p) ? 'bg-[var(--blue-light)] border-[var(--blue)] text-[var(--blue)]' : 'bg-white border-[var(--border)] text-[var(--text-sub)]'
                      }`}
                    >
                      {form.provinces.includes(p) && <Check size={10} className="inline mr-1" />}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Via Point (optional)</label>
                <input value={form.via} onChange={e => setForm(f => ({ ...f, via: e.target.value }))}
                  placeholder="e.g. Kagitumba"
                  className="w-full h-12 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5">Shown as e.g. Kigali → Kampala via Kagitumba. Adding another via to the same corridor creates a distinct route.</p>
              </div>

              {error && <p className="text-xs text-[var(--text-sub)]">{error}</p>}

              <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-md border border-[var(--border)] text-sm font-semibold cursor-pointer bg-white">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-12 rounded-md bg-[var(--blue)] text-white text-sm font-semibold hover:bg-[var(--blue-dark)] transition-colors disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  {saving ? <Loader size={16} className="animate-spin" /> : null}
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Routes Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowBulkModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-md p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-[var(--font-body)] text-xl font-black text-[var(--text)]">Bulk Add Routes</h2>
                <p className="text-xs text-[var(--text-sub)] mt-1">Add multiple routes at once. Fill in each row then save.</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="w-8 h-8 rounded-sm hover:bg-[#F9FAFB] flex items-center justify-center cursor-pointer border-none bg-transparent"><X size={18} /></button>
            </div>

            {agencies.length > 0 && (
              <div className="mb-4">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-sub)] mb-2 block">Agency (for all routes)</label>
                <select value={form.agencyId} onChange={e => setForm(f => ({ ...f, agencyId: e.target.value }))}
                  className="w-full h-10 px-4 rounded-md border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--blue)] bg-white"
                >
                  <option value="">Select agency</option>
                  {agencies.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {bulkResult ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--blue-light)] flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-[var(--blue)]" />
                </div>
                <p className="text-lg font-bold text-[var(--text)]">Done!</p>
                <p className="text-sm text-[var(--text-sub)] mt-1">{bulkResult.created} route(s) created, {bulkResult.failed} failed.</p>
                <button onClick={() => setShowBulkModal(false)} className="mt-6 px-6 py-2.5 rounded-md bg-[var(--blue)] text-white text-sm font-semibold cursor-pointer border-none">Close</button>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">#</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">Origin *</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">Destination *</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">Price (RWF) *</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">Via (optional)</th>
                        <th className="px-2 py-2 text-left text-[10px] font-bold uppercase text-[var(--text-muted)]">Duration</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)]">
                          <td className="px-2 py-1.5 text-xs text-[var(--text-muted)]">{i + 1}</td>
                          <td className="px-2 py-1.5">
                            <input value={row.origin} onChange={e => updateBulkRow(i, 'origin', e.target.value)}
                              placeholder="Kigali" className="h-9 px-2 rounded-md border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--blue)] w-full"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.destination} onChange={e => updateBulkRow(i, 'destination', e.target.value)}
                              placeholder="Musanze" className="h-9 px-2 rounded-md border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--blue)] w-full"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.price} onChange={e => updateBulkRow(i, 'price', e.target.value)}
                              type="number" min="0" placeholder="5000" className="h-9 px-2 rounded-md border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--blue)] w-full"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.via} onChange={e => updateBulkRow(i, 'via', e.target.value)}
                              placeholder="Kagitumba" className="h-9 px-2 rounded-md border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--blue)] w-full"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input value={row.estimatedDuration} onChange={e => updateBulkRow(i, 'estimatedDuration', e.target.value)}
                              placeholder="2h 30m" className="h-9 px-2 rounded-md border border-[var(--border)] text-xs focus:outline-none focus:border-[var(--blue)] w-full"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            {bulkRows.length > 1 && (
                              <button onClick={() => removeBulkRow(i)} className="w-7 h-7 rounded hover:bg-[#F9FAFB] flex items-center justify-center text-[var(--text-muted)] hover:text-zinc-600 cursor-pointer border-none bg-transparent">
                                <X size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={addBulkRow}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--blue)] mb-4 cursor-pointer bg-transparent border-none hover:underline"
                >
                  <Plus size={12} /> Add another row
                </button>

                {bulkError && <p className="text-xs text-[var(--text-sub)] mb-3">{bulkError}</p>}

                <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
                  <button onClick={() => setShowBulkModal(false)} className="flex-1 h-10 rounded-md border border-[var(--border)] text-sm font-semibold cursor-pointer bg-white">Cancel</button>
                  <button onClick={handleBulkSave} disabled={bulkSaving || !form.agencyId}
                    className="flex-1 h-10 rounded-md bg-[var(--blue)] text-white text-sm font-semibold hover:bg-[var(--blue-dark)] transition-colors disabled:opacity-50 cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    {bulkSaving ? <Loader size={16} className="animate-spin" /> : null}
                    {bulkSaving ? 'Saving...' : `Save ${bulkRows.filter(r => r.origin && r.destination && r.price).length} Route(s)`}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
