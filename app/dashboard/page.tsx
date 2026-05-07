import ResponsiveDashboardContent from '@/components/ResponsiveDashboardContent';
import PerformanceStatsWidget from '@/components/PerformanceStatsWidget';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ background: '#FAFBFE' }}>
      {/* Scrollable Content Area */}
      <div className="flex flex-1 min-h-0 overflow-y-auto">
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <ResponsiveDashboardContent />
        </main>

        {/* Right Sidebar — visible on lg+ screens */}
        <aside
          className="hidden lg:block flex-shrink-0"
          style={{
            width: 'clamp(280px,20vw,340px)',
            background: '#FAFBFE',
            borderLeft: '1px solid #E5E7EB',
            padding: 'clamp(0.875rem,1vw,1.25rem)',
            paddingRight: 'clamp(0.5rem,0.73vw,0.875rem)',
          }}
        >
          <PerformanceStatsWidget />
        </aside>
      </div>
    </div>
  );
}
