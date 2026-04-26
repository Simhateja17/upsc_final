'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  duration: '',
  durationDays: '90',
  badge: '',
  isPopular: false,
  isActive: true,
  order: '0',
};

export default function PricingManager() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [features, setFeatures] = useState<string[]>(['']);
  const [notIncluded, setNotIncluded] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminService.getPricingPlans()
      .then((res) => setPlans(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setFeatures(['']);
    setNotIncluded(['']);
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price || ''),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      duration: p.duration || '',
      durationDays: String(p.durationDays || 90),
      badge: p.badge || '',
      isPopular: p.isPopular || false,
      isActive: p.isActive !== false,
      order: String(p.order || 0),
    });
    setFeatures((p.features || []).length > 0 ? p.features : ['']);
    setNotIncluded((p.notIncluded || []).length > 0 ? p.notIncluded : ['']);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pricing plan? This cannot be undone.')) return;
    try {
      await adminService.deletePricingPlan(id);
      showMsg('Plan deleted.');
      load();
    } catch (err: any) {
      showMsg(`Error: ${err.message}`);
    }
  };

  const handleToggleActive = async (p: any) => {
    try {
      await adminService.updatePricingPlan(p.id, { isActive: !p.isActive });
      load();
    } catch {}
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.duration) {
      showMsg('Error: Name, price and duration are required.');
      return;
    }
    setSaving(true);
    try {
      const cleanFeatures = features.map(f => f.trim()).filter(Boolean);
      const cleanNotIncluded = notIncluded.map(f => f.trim()).filter(Boolean);
      const data = {
        ...form,
        price: parseInt(form.price) || 0,
        originalPrice: form.originalPrice ? parseInt(form.originalPrice) : undefined,
        durationDays: parseInt(form.durationDays) || 90,
        order: parseInt(form.order) || 0,
        features: cleanFeatures,
        notIncluded: cleanNotIncluded,
      };
      if (editing) {
        await adminService.updatePricingPlan(editing.id, data);
        showMsg('Plan updated successfully!');
      } else {
        await adminService.createPricingPlan(data);
        showMsg('Plan created successfully!');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err: any) {
      showMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, '']);
  };

  const updateFeature = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const updated = [...list];
    updated[idx] = val;
    setList(updated);
  };

  const removeFeature = (list: string[], setList: (v: string[]) => void, idx: number) => {
    if (list.length === 1) { setList(['']); return; }
    setList(list.filter((_, i) => i !== idx));
  };

  const inputCls = "w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent";
  const labelCls = "block text-xs font-medium text-[#6B7280] mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-[#111827] text-2xl">Pricing Plans</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage all plans, features, and pricing dynamically.</p>
        </div>
        {!showForm && (
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#6366F1] hover:bg-[#4f46e5] transition-colors"
          >
            + Add New Plan
          </button>
        )}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
          msg.startsWith('Error') ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' : 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
        }`}>
          {msg}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg text-[#111827]">
              {editing ? `Edit: ${editing.name}` : 'New Pricing Plan'}
            </h2>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-[#6B7280] hover:text-[#374151] text-sm">
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form fields */}
            <div className="flex flex-col gap-4">
              {/* Row 1: Name + Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Plan Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Foundation" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Badge Label</label>
                  <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="e.g. Most Popular" className={inputCls} />
                </div>
              </div>

              {/* Row 2: Price + Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 4999" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Original Price (₹) <span className="text-[#9CA3AF]">(strikethrough)</span></label>
                  <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="e.g. 6999" className={inputCls} />
                </div>
              </div>

              {/* Row 3: Duration text + days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Duration Label *</label>
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 3 months" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Duration (days)</label>
                  <input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                    placeholder="90" className={inputCls} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description shown to users" rows={2}
                  className={`${inputCls} resize-none`} />
              </div>

              {/* Row 4: Order + Flags */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className={labelCls}>Display Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className={inputCls} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#6366F1]" />
                  <span className="text-sm text-[#374151]">Mark Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#10B981]" />
                  <span className="text-sm text-[#374151]">Active</span>
                </label>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls}>✅ Included Features</label>
                  <button onClick={() => addFeature(features, setFeatures)} className="text-xs text-[#6366F1] hover:underline">
                    + Add
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={(e) => updateFeature(features, setFeatures, i, e.target.value)}
                        placeholder={`Feature ${i + 1}`}
                        className={inputCls}
                      />
                      <button onClick={() => removeFeature(features, setFeatures, i)}
                        className="text-[#9CA3AF] hover:text-[#EF4444] w-8 flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not Included */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelCls}>❌ Not Included</label>
                  <button onClick={() => addFeature(notIncluded, setNotIncluded)} className="text-xs text-[#6366F1] hover:underline">
                    + Add
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {notIncluded.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={f}
                        onChange={(e) => updateFeature(notIncluded, setNotIncluded, i, e.target.value)}
                        placeholder={`Not included ${i + 1}`}
                        className={inputCls}
                      />
                      <button onClick={() => removeFeature(notIncluded, setNotIncluded, i)}
                        className="text-[#9CA3AF] hover:text-[#EF4444] w-8 flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg text-white font-medium text-sm bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : editing ? '✓ Update Plan' : '✓ Create Plan'}
                </button>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 rounded-lg font-medium text-sm text-[#6B7280] border border-[#E5E7EB] hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="hidden lg:block">
              <p className={labelCls}>Live Preview</p>
              <div
                className={`bg-white rounded-[18px] p-6 flex flex-col border-2 max-w-[320px] transition-all ${
                  form.isPopular ? 'border-[#f0b100]' : 'border-[#E5E7EB]'
                }`}
                style={{ boxShadow: '0px 4px 20px rgba(0,0,0,0.08)' }}
              >
                {form.badge && (
                  <div className="inline-block self-center bg-[#f0b100] text-[#0f172b] text-xs font-bold px-4 py-1 rounded-full mb-3">
                    {form.badge}
                  </div>
                )}
                <h3 className="text-[#0f172b] font-bold text-lg mb-1">{form.name || 'Plan Name'}</h3>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-[#0f172b] text-3xl font-bold">
                    ₹{parseInt(form.price || '0').toLocaleString()}
                  </span>
                  {form.originalPrice && parseInt(form.originalPrice) > parseInt(form.price || '0') && (
                    <span className="text-[#90a1b9] text-base line-through mb-0.5">
                      ₹{parseInt(form.originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[#62748e] text-sm mb-3">for {form.duration || 'duration'}</p>
                {form.description && (
                  <p className="text-[#62748e] text-xs mb-3 border-t border-[#f1f5f9] pt-2">{form.description}</p>
                )}
                <ul className="flex flex-col gap-1.5 mb-4">
                  {features.filter(Boolean).slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#314158] text-xs">
                      <span className="text-[#16a34a] flex-shrink-0">✓</span> {f}
                    </li>
                  ))}
                  {notIncluded.filter(Boolean).slice(0, 3).map((f, i) => (
                    <li key={`n-${i}`} className="flex items-start gap-2 text-[#90a1b9] text-xs">
                      <span className="flex-shrink-0">✗</span> {f}
                    </li>
                  ))}
                </ul>
                <div className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center ${
                  form.isPopular ? 'bg-[#f0b100] text-[#0f172b]' : 'bg-[#1d293d] text-white'
                }`}>
                  {form.isPopular ? '✨ Get Started' : 'Purchase Plan'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[#111827]">All Plans ({plans.length})</h2>
          <p className="text-xs text-[#6B7280]">Click Edit to modify any plan — all fields are configurable</p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-sm text-[#6B7280] mb-3">No pricing plans yet.</p>
            <button onClick={openNew} className="text-sm text-[#6366F1] hover:underline">Create your first plan →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((p: any) => (
              <div
                key={p.id}
                className={`rounded-xl p-5 border-2 transition-all ${
                  p.isPopular ? 'border-[#f0b100]' : 'border-[#E5E7EB]'
                } ${!p.isActive ? 'opacity-60' : ''}`}
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-[#111827] text-base">{p.name}</p>
                      {p.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] font-medium">{p.badge}</span>
                      )}
                      {p.isPopular && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">⭐ Popular</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-[#111827]">₹{p.price?.toLocaleString()}</span>
                      {p.originalPrice && (
                        <span className="text-sm text-[#9ca3af] line-through">₹{p.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280]">{p.duration} · {p.durationDays} days</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    p.isActive ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">{p.description}</p>
                )}

                {/* Features */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[#374151] mb-1.5">Included ({(p.features || []).length})</p>
                  <ul className="space-y-1">
                    {(p.features || []).slice(0, 5).map((f: string, i: number) => (
                      <li key={i} className="text-xs text-[#374151] flex items-start gap-1.5">
                        <span className="text-[#10B981] flex-shrink-0">✓</span> {f}
                      </li>
                    ))}
                    {(p.features || []).length > 5 && (
                      <li className="text-xs text-[#6B7280] pl-4">+{p.features.length - 5} more</li>
                    )}
                  </ul>
                </div>

                {(p.notIncluded || []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-[#374151] mb-1.5">Not Included ({p.notIncluded.length})</p>
                    <ul className="space-y-1">
                      {(p.notIncluded || []).slice(0, 3).map((f: string, i: number) => (
                        <li key={i} className="text-xs text-[#9ca3af] flex items-start gap-1.5">
                          <span className="flex-shrink-0">✗</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 flex-wrap pt-2 border-t border-[#F3F4F6]">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-medium hover:bg-[#DBEAFE] transition-colors"
                  >
                    ✏ Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      p.isActive
                        ? 'bg-[#FFFBEB] text-[#92400E] hover:bg-[#FEF3C7]'
                        : 'bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]'
                    }`}
                  >
                    {p.isActive ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[#FEF2F2] text-[#991B1B] font-medium hover:bg-[#FEE2E2] transition-colors"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
