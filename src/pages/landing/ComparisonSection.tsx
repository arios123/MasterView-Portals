import { X, Check, AlertTriangle, Zap } from "lucide-react";

const erpPainPoints = [
  {
    pain: "Contracts and changes tracked in spreadsheets",
    solution: "Quotes, contracts, and change orders — all connected"
  },
  {
    pain: "Change orders are manual and messy",
    solution: "Changes update contracts automatically"
  },
  {
    pain: "Projects don't reflect contract reality",
    solution: "Original scope + changes, always visible"
  },
  {
    pain: "Months of setup requiring consultants",
    solution: "Start managing projects in under an hour"
  },
  {
    pain: "Tools that feel too big or confusing",
    solution: "Learn the system in under an hour"
  },
  {
    pain: "Expensive per-seat licensing that grows fast",
    solution: "Transparent pricing that scales with you"
  },
  {
    pain: "Keep your data locked, complicated to export",
    solution: "Take your data with you, export anytime"
  }
];

export function ComparisonSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#e7ebed] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#96ab94]/20 border border-[#96ab94] mb-6">
            <AlertTriangle className="w-4 h-4 text-[#617b5d]" />
            <span className="text-sm font-medium text-[#617b5d]">
              The ERP problem
            </span>
          </div>
          
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6">
            Enterprise software wasn't built
            <span className="block text-[#8b8b8b]">for small, growing teams</span>
          </h2>
          
          <p className="text-lg text-[#617b5d] leading-relaxed max-w-2xl mx-auto">
            ERPs are powerful, but they assume enterprise scale. If you just need to 
            manage contracts, make changes, and keep track of your clients — there's a simpler way.
          </p>
        </div>

        {/* Comparison: mobile = stacked (wrong + solution per item), desktop = two columns */}
        <div className="max-w-5xl mx-auto">
          {/* Mobile only: stacked comparison — wrong with strikethrough/red, then solution underneath */}
          <div className="lg:hidden space-y-6">
            {erpPainPoints.map((item, index) => (
              <div key={index} className="relative rounded-xl overflow-visible border border-[#cfcfcf] bg-white shadow-sm">
                <div className="relative flex gap-3 p-4 pt-5 border-b border-[#a6dbeb]/30 border-l-4 border-l-[#2b8ac4] bg-[#a6dbeb]/10">
                  <span className="absolute -top-2.5 left-3 z-10 inline-block rounded-md border border-[#a6dbeb] bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#2b8ac4] shadow-sm">
                    MasterView
                  </span>
                  <div className="w-6 h-6 rounded-full bg-[#a6dbeb]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#2b8ac4]" />
                  </div>
                  <p className="text-[#0B294b] text-sm leading-relaxed font-medium">
                    {item.solution}
                  </p>
                </div>
                <div className="relative flex gap-3 p-4 pt-5 bg-white">
                  <span className="absolute -top-2.5 left-3 z-10 inline-block rounded-md border border-red-200 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-500 shadow-sm">
                    ERP
                  </span>
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <p className="text-[#617b5d] text-sm leading-relaxed line-through decoration-red-400 decoration-[1px]">
                    {item.pain}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: two-column grid */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Traditional ERP column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl bg-[#cfcfcf] flex items-center justify-center">
                  <X className="w-5 h-5 text-[#8b8b8b]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#617b5d]">Traditional ERPs</h3>
                  <p className="text-sm text-[#8b8b8b]">Complex, slow to implement</p>
                </div>
              </div>
              
              {erpPainPoints.map((item, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-5 bg-white rounded-xl border border-[#cfcfcf] shadow-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <p className="text-[#617b5d] text-sm leading-relaxed">{item.pain}</p>
                </div>
              ))}
            </div>

            {/* MasterView column */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl bg-[#a6dbeb]/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#2b8ac4]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0B294b]">MasterView</h3>
                  <p className="text-sm text-[#8b8b8b]">Simple, purpose-built</p>
                </div>
              </div>
              
              {erpPainPoints.map((item, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-5 bg-white rounded-xl border border-[#a6dbeb] shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-6 h-6 rounded-full bg-[#a6dbeb]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#2b8ac4]" />
                  </div>
                  <p className="text-[#0B294b] text-sm leading-relaxed">{item.solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="mt-16 lg:mt-20 text-center">
          <p className="text-lg text-[#617b5d] italic max-w-2xl mx-auto">
            "We tried Odoo and spent three months just getting it configured. 
            MasterView Portals had us up and running the same week."
          </p>
          <p className="mt-4 text-sm text-[#8b8b8b]">
            — Small Business Owner
          </p>
        </div>
      </div>
    </section>
  );
}
