import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import ResponsiveDashboardContent from '@/components/ResponsiveDashboardContent';
import PerformanceStatsWidget from '@/components/PerformanceStatsWidget';

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
          className="hidden xl:block border-l border-gray-200 bg-white"
          style={{
            width: 'clamp(320px,18.6vw,358px)',
            minWidth: '320px',
            maxWidth: '358px',
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
