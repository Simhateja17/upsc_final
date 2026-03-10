'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/services';

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isPublished: boolean;
  sectionCount: number;
  updatedAt: string;
}

export default function CmsPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const res = await adminService.getCmsPages();
      setPages(res.data || []);
    } catch (err) {
      console.error('Failed to load CMS pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Manager</h1>
          <p className="text-gray-500 mt-1">Manage content for all frontend pages</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search pages by title or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((page) => (
          <div
            key={page.id}
            onClick={() => router.push(`/admin/cms/${encodeURIComponent(page.slug)}`)}
            className="bg-white rounded-xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {page.title}
                </h3>
                <p className="text-sm text-gray-400 font-mono mt-0.5">/{page.slug}</p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  page.isPublished
                    ? 'bg-green-50 text-green-600'
                    : 'bg-yellow-50 text-yellow-600'
                }`}
              >
                {page.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            {page.description && (
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{page.description}</p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{page.sectionCount} sections</span>
              <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {search ? 'No pages match your search.' : 'No CMS pages found. Run the seed script to populate.'}
        </div>
      )}
    </div>
  );
}
