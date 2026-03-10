'use client';

import { useState, useEffect, useRef } from 'react';
import { cmsService } from '@/lib/services';

interface CmsContent {
  [key: string]: any;
}

interface UseCmsContentResult {
  content: CmsContent;
  loading: boolean;
  error: string | null;
  get: (key: string, fallback?: any) => any;
}

// In-memory cache shared across all hook instances to avoid duplicate fetches
const cache: Record<string, { data: CmsContent; timestamp: number }> = {};
const inflight: Record<string, Promise<CmsContent | null>> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchPageContent(slug: string): Promise<CmsContent | null> {
  const cached = cache[slug];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Deduplicate concurrent requests for the same slug
  if (!inflight[slug]) {
    inflight[slug] = cmsService
      .getPageContent(slug)
      .then((res) => {
        const data = res.data?.content || null;
        if (data) {
          cache[slug] = { data, timestamp: Date.now() };
        }
        return data;
      })
      .catch(() => null)
      .finally(() => {
        delete inflight[slug];
      });
  }

  return inflight[slug];
}

export function useCmsContent(slug: string, defaults: CmsContent = {}): UseCmsContentResult {
  const [content, setContent] = useState<CmsContent>(() => {
    const cached = cache[slug];
    return cached ? { ...defaults, ...cached.data } : defaults;
  });
  const [loading, setLoading] = useState(!cache[slug]);
  const [error, setError] = useState<string | null>(null);
  const defaultsRef = useRef(defaults);

  useEffect(() => {
    let cancelled = false;

    fetchPageContent(slug).then((data) => {
      if (!cancelled) {
        if (data) {
          setContent({ ...defaultsRef.current, ...data });
        }
        setLoading(false);
      }
    }).catch((err: any) => {
      if (!cancelled) {
        setError(err?.message || 'Failed to load CMS content');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [slug]);

  const get = (key: string, fallback?: any) => {
    return content[key] ?? fallback ?? defaults[key];
  };

  return { content, loading, error, get };
}
