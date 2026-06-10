import ResponsiveDashboardContent from '@/components/ResponsiveDashboardContent';
import PerformanceStatsWidget from '@/components/PerformanceStatsWidget';

export default function DashboardPage() {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ background: '#FAFBFE' }}>
      {/* Scrollable Content Area — stacks on mobile, side-by-side on lg+ */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto">
        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <ResponsiveDashboardContent />
        </main>

        {/* Right Sidebar – sits below content on mobile, beside it on lg+ */}
        <aside
          className="w-full lg:w-auto flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[#E5E7EB]"
          style={{
            background: '#FAFBFE',
            padding: 'clamp(0.875rem,1vw,1.25rem)',
          }}
        >
          <div className="w-full lg:w-[clamp(280px,20vw,340px)]">
            <PerformanceStatsWidget />
          </div>
        </aside>
      </div>
    </div>
  );
}
