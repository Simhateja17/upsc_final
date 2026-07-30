'use client';

import { useEffect, useState } from 'react';
import { billingService } from '@/lib/services';
import { useAuth } from '@/contexts/AuthContext';

const FONT = 'var(--font-dm-sans), "DM Sans", Inter, sans-serif';
const CORMORANT = 'var(--font-cormorant-garamond), "Cormorant Garamond", Georgia, serif';

const inputStyle: React.CSSProperties = {
  width: '100%', marginTop: 7, borderRadius: 9, border: '1px solid rgba(11,22,40,0.17)', background: '#faf8f4',
  padding: '12px 17px', fontSize: 14, fontFamily: FONT, color: '#0c1424', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.88px', textTransform: 'uppercase', color: '#6b7a99',
};

export default function EditBillingAddressModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await billingService.getBillingAddress();
        const address = res?.data;
        if (!cancelled) {
          if (address) {
            setFullName(address.fullName || '');
            setEmail(address.email || '');
            setPhone(address.phone || '');
            setCity(address.city || '');
            setState(address.state || '');
          } else {
            setFullName([user?.firstName, user?.lastName].filter(Boolean).join(' '));
            setEmail(user?.email || '');
            setPhone(user?.phone || '');
          }
        }
      } catch {
        if (!cancelled) {
          setFullName([user?.firstName, user?.lastName].filter(Boolean).join(' '));
          setEmail(user?.email || '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) return;
    setBusy(true);
    setError('');
    try {
      await billingService.saveBillingAddress({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Unable to save your billing address. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,15,35,0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#f4f6fa', borderRadius: 20,
          boxShadow: '0 24px 80px rgba(9,14,28,0.5), 0 24px 40px rgba(9,14,28,0.25)',
          width: '100%', maxWidth: 652,
          fontFamily: FONT,
          padding: '36px',
        }}
      >
        <h2 style={{ margin: 0, fontFamily: CORMORANT, fontWeight: 600, fontSize: 24, color: '#0c1424' }}>Update Billing Address</h2>
        <p style={{ margin: '8px 0 0', fontFamily: FONT, fontSize: 13, color: '#6b7a99' }}>Used for GST invoice generation.</p>

        {loading ? (
          <p style={{ marginTop: 24, fontFamily: FONT, fontSize: 13, color: '#6b7a99' }}>Loading…</p>
        ) : (
          <>
            <div style={{ marginTop: 18 }}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} placeholder="+91 XXXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>

            {error && <p style={{ margin: '16px 0 0', fontFamily: FONT, fontSize: 13, color: '#ef4444' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                style={{
                  flex: 1, borderRadius: 9, border: '1px solid rgba(11,22,40,0.17)', background: 'transparent', padding: '11px 23px',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#374560', cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy || !fullName.trim() || !email.trim()}
                style={{
                  flex: 1, borderRadius: 9, border: 'none', background: '#e8b84b', padding: '11px 22px',
                  fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#090e1c',
                  cursor: busy || !fullName.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                  opacity: !fullName.trim() || !email.trim() ? 0.6 : 1,
                }}
              >
                {busy ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

