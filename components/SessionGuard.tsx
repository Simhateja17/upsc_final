'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/lib/services';
import { supabase } from '@/lib/supabase';

const HEARTBEAT_MS = 60_000;

/**
 * Enforces single-device sessions on the client:
 *  - Listens for the `session-superseded` event (dispatched by the API layer on
 *    a 401 SESSION_SUPERSEDED) → signs this device out and shows a notice.
 *  - Polls a lightweight endpoint every ~60s so an idle, untouched device also
 *    drops shortly after the account is used elsewhere (not only on next tap).
 */
export default function SessionGuard() {
  const { isAuthenticated } = useAuth();
  const [notice, setNotice] = useState(false);

  // Handle the superseded broadcast: sign out + surface a notice.
  useEffect(() => {
    let handled = false;
    const onSuperseded = async () => {
      if (handled) return;
      handled = true;
      try { await supabase.auth.signOut(); } catch {}
      try { localStorage.removeItem('last_registered_session'); } catch {}
      // Persist across the redirect so the notice shows on the login screen.
      try { sessionStorage.setItem('session_superseded_notice', '1'); } catch {}
      window.location.href = '/';
    };
    window.addEventListener('session-superseded', onSuperseded);
    return () => window.removeEventListener('session-superseded', onSuperseded);
  }, []);

  // Show the notice once after we land back on a page post-redirect.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('session_superseded_notice') === '1') {
        sessionStorage.removeItem('session_superseded_notice');
        setNotice(true);
      }
    } catch {}
  }, []);

  // Idle heartbeat: any authenticated call trips the gate if superseded, which
  // makes the API layer dispatch `session-superseded`. We ignore the result.
  useEffect(() => {
    if (!isAuthenticated) return;
    const tick = () => { userService.getSessions().catch(() => {}); };
    const interval = setInterval(tick, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!notice) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[10000] flex justify-center px-4 pt-3 pointer-events-none">
      <div className="pointer-events-auto max-w-[520px] w-full rounded-xl bg-[#1a2540] text-white shadow-lg px-4 py-3 flex items-start gap-3">
        <span className="text-[18px] leading-none mt-[1px]">🔒</span>
        <p className="flex-1 text-[14px] leading-[20px]">
          You were signed out because your account was signed in on another device.
        </p>
        <button
          onClick={() => setNotice(false)}
          className="text-white/70 hover:text-white text-[16px] leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
