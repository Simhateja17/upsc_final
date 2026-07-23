export default function QuestionLoading() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <div className="h-[66px] border-b border-white/[0.06] bg-[rgba(7,14,30,0.98)]" />
      <main className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="h-1 bg-gradient-to-r from-[#F5D06E] via-[#D4AF37] to-[#B8941E]" />
          <div className="p-6 sm:p-9">
            <div className="mb-6 flex gap-2">
              <div className="h-8 w-24 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-8 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
            </div>
            <div className="mb-5 h-4 w-48 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="space-y-3">
              <div className="h-7 w-full animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-7 w-11/12 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="h-7 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
            </div>
            <div className="mt-8 space-y-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-[58px] animate-pulse rounded-[14px] border border-[#E2E6EE] bg-[#F8F9FB]" />
              ))}
            </div>
          </div>
        </div>
        <aside className="hidden space-y-6 lg:block">
          <div className="h-56 animate-pulse rounded-[18px] border border-[#E5E7EB] bg-white" />
          <div className="h-72 animate-pulse rounded-[18px] border border-[#E5E7EB] bg-white" />
        </aside>
      </main>
    </div>
  );
}
