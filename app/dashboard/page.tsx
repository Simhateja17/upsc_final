import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import ResponsiveDashboardContent from '@/components/ResponsiveDashboardContent';
import PerformanceStatsWidget from '@/components/PerformanceStatsWidget';

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen" style={{ background: '#D8DEE6' }}>
      {/* Dashboard Header - Full Width */}
      <DashboardHeader />

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1">
          <ResponsiveDashboardContent />
        </main>

        {/* Right Sidebar */}
        <aside
          className="hidden xl:block"
          style={{
            width: 'clamp(320px,18.6vw,358px)',
            minWidth: '320px',
            maxWidth: '358px',
            background: 'linear-gradient(180deg, #E6EAF0 0%, #DDE2EA 100%)',
          }}
        >
          <div className="p-[clamp(1rem,1.25vw,1.5rem)]">
            <PerformanceStatsWidget />
          </div>
        </aside>
      </div>
    </div>
  );
}
