'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/services';

interface ContentStats {
  cmsPages: number;
  dailyMcqs: number;
  dailyMains: number;
  editorials: number;
  testimonials: number;
  pricingPlans: number;
  videoSubjects: number;
  pyqStats: { total: number; approved: number } | null;
}

const StatCard = ({
  label,
  count,
  icon,
  href,
  color,
}: {
  label: string;
  count: number | string;
  icon: string;
  href: string;
  color: string;
}) => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${color}15`, color }}
        >
          View All
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default function ContentHubPage() {
  const [stats, setStats] = useState<ContentStats>({
    cmsPages: 0,
    dailyMcqs: 0,
    dailyMains: 0,
    editorials: 0,
    testimonials: 0,
    pricingPlans: 0,
    videoSubjects: 0,
    pyqStats: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const results = await Promise.allSettled([
        adminService.getCmsPages(),
        adminService.getDailyMCQSets(),
        adminService.getDailyMainsQuestions(),
        adminService.getEditorials(),
        adminService.getTestimonials(),
        adminService.getPricingPlans(),
        adminService.getVideoSubjects(),
        adminService.getPYQStats(),
      ]);

      setStats({
        cmsPages: results[0].status === 'fulfilled' ? (results[0].value.data?.length || 0) : 0,
        dailyMcqs: results[1].status === 'fulfilled' ? (results[1].value.data?.length || 0) : 0,
        dailyMains: results[2].status === 'fulfilled' ? (results[2].value.data?.length || 0) : 0,
        editorials: results[3].status === 'fulfilled' ? (results[3].value.data?.length || 0) : 0,
        testimonials: results[4].status === 'fulfilled' ? (results[4].value.data?.length || 0) : 0,
        pricingPlans: results[5].status === 'fulfilled' ? (results[5].value.data?.length || 0) : 0,
        videoSubjects: results[6].status === 'fulfilled' ? (results[6].value.data?.length || 0) : 0,
        pyqStats: results[7].status === 'fulfilled' ? results[7].value.data : null,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { label: 'Edit Home Page', icon: '🏠', href: '/admin/cms/home' },
    { label: 'Add Daily MCQ', icon: '📝', href: '/admin/daily-content' },
    { label: 'Add Editorial', icon: '📰', href: '/admin/editorials' },
    { label: 'Upload PYQ', icon: '📚', href: '/admin/pyq' },
    { label: 'Manage Videos', icon: '🎥', href: '/admin/videos' },
    { label: 'Edit Pricing', icon: '💳', href: '/admin/pricing' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Content Hub</h1>
        <p className="text-gray-500 mt-1">All your content at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="CMS Pages" count={stats.cmsPages} icon="📄" href="/admin/cms" color="#3B82F6" />
        <StatCard label="Daily MCQs" count={stats.dailyMcqs} icon="📝" href="/admin/daily-content" color="#10B981" />
        <StatCard label="Mains Questions" count={stats.dailyMains} icon="✍️" href="/admin/daily-content" color="#F59E0B" />
        <StatCard label="Editorials" count={stats.editorials} icon="📰" href="/admin/editorials" color="#8B5CF6" />
        <StatCard label="Video Subjects" count={stats.videoSubjects} icon="🎥" href="/admin/videos" color="#EC4899" />
        <StatCard label="Testimonials" count={stats.testimonials} icon="⭐" href="/admin/testimonials" color="#F97316" />
        <StatCard label="Pricing Plans" count={stats.pricingPlans} icon="💳" href="/admin/pricing" color="#06B6D4" />
        <StatCard
          label="PYQ Questions"
          count={stats.pyqStats ? `${stats.pyqStats.approved}/${stats.pyqStats.total}` : '0'}
          icon="📚"
          href="/admin/pyq"
          color="#6366F1"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-center"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs text-gray-600 font-medium">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
