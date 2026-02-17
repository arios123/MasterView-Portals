import { Users, BookOpen, Download } from "lucide-react";

const valueProps = [
  {
    icon: Users,
    title: "Built for small, growing teams",
    description: "You want to be professional, but not buried in software. We assume limited time and resources — and scale without becoming harder.",
    highlight: "Structure without bureaucracy"
  },
  {
    icon: BookOpen,
    title: "Learn the system in under an hour",
    description: "No consultants. No training sessions. Built-in tutorials guide you through every feature as you work.",
    highlight: "Your team gets confident fast"
  },
  {
    icon: Download,
    title: "No lock-in. Export anytime.",
    description: "Your data is yours. Export everything whenever you need to. We earn your business by being useful, not by trapping you.",
    highlight: "Full data portability"
  }
];

export function ValueProps() {
  return (
    <section className="py-24 lg:py-32 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6">
            Built for teams who'd rather
            <span className="block text-[#2b8ac4]">work than configure.</span>
          </h2>
          
          <p className="text-lg text-[#617b5d] leading-relaxed">
            Every feature is designed to help contract-based businesses stay organized — 
            without wrestling with enterprise software.
          </p>
        </div>

        {/* Value props grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <div 
                key={index}
                className="group p-8 bg-[#e7ebed] rounded-2xl hover:bg-white hover:shadow-smooth-lg transition-all duration-300 border border-transparent hover:border-[#cfcfcf]"
              >
                <div className="w-12 h-12 rounded-xl bg-white group-hover:bg-[#a6dbeb]/30 flex items-center justify-center mb-6 shadow-sm transition-colors">
                  <Icon className="w-6 h-6 text-[#0B294b] group-hover:text-[#2b8ac4] transition-colors" />
                </div>
                
                <h3 className="font-serif text-xl font-semibold text-[#0B294b] mb-3">
                  {prop.title}
                </h3>
                
                <p className="text-[#617b5d] leading-relaxed mb-4">
                  {prop.description}
                </p>
                
                <div className="inline-flex items-center gap-2 text-sm font-medium text-[#2b8ac4]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2b8ac4]" />
                  {prop.highlight}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
