'use client';

import { FormEvent, useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function PhoneLinkPrompt() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.phone) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [user]);

  if (!open || !user || user.phone) return null;

  const sanitizePhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    const normalizedInput = sanitizePhone(phone);
    if (!/^[6-9]\d{9}$/.test(normalizedInput)) {
      setError('Enter a valid 10 digit Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await authService.sendPhoneLinkOtp(normalizedInput);
      setPhone(result.phone);
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.verifyPhoneOtp('link', phone, otp);
      await refreshUser();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    height: 46,
    borderRadius: 10,
    border: '1px solid #D1D5DB',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
  } as const;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[420px] rounded-[14px] bg-white p-5 shadow-2xl">
        <div>
          <h2 className="font-inter text-[18px] font-bold text-[#101828]">Verify your mobile number</h2>
          <p className="mt-1 font-inter text-sm leading-5 text-[#667085]">
            A verified Indian mobile number is required to use your RiseWithJeet account.
          </p>
        </div>

        <form onSubmit={step === 'phone' ? sendOtp : verifyOtp} className="mt-5">
          {step === 'phone' ? (
            <>
              <label className="mb-2 block font-inter text-xs font-bold uppercase tracking-[0.02em] text-[#344054]">
                Indian mobile number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                placeholder="98765 43210"
                required
                style={inputStyle}
              />
            </>
          ) : (
            <>
              <label className="mb-2 block font-inter text-xs font-bold uppercase tracking-[0.02em] text-[#344054]">
                OTP sent to {phone}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="mt-3 font-inter text-xs font-semibold text-[#155DFC]"
              >
                Change number
              </button>
            </>
          )}

          {error && <p className="mt-3 font-inter text-sm text-[#DC2626]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-11 w-full rounded-[10px] bg-[#101828] font-inter text-sm font-bold text-white disabled:bg-[#9CA3AF]"
          >
            {loading ? 'Please wait...' : step === 'phone' ? 'Send OTP' : 'Verify mobile number'}
          </button>
        </form>
      </div>
    </div>
  );
}
