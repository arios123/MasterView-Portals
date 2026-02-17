import { Star } from "lucide-react";

const metrics = [
  { value: "47", unit: "min", label: "Average setup time" },
  { value: "1", unit: "hr", label: "To learn core features" },
  { value: "0", unit: "", label: "Consultants required" }
];

const testimonials = [
  {
    quote: "We tried three different project management tools before MasterView. This is the first one my whole team actually uses.",
    author: "Sarah Chen",
    role: "Principal Designer",
    company: "Chen Interiors"
  },
  {
    quote: "The change order tracking alone has saved us countless hours of back-and-forth. Clients can see exactly what changed and approve right in the portal.",
    author: "Michael Torres",
    role: "Operations Manager",
    company: "Moderno Design Studio"
  },
  {
    quote: "Finally, software that doesn't make me feel like I need an IT degree. My team was comfortable with it by the end of day one.",
    author: "Jessica Park",
    role: "Founder",
    company: "Park & Associates"
  }
];

export function SocialProof() {
  return (
    <section className="py-12 lg:py-16 bg-[#0B294b] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Metrics row */}
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl lg:text-6xl font-bold text-white">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="text-2xl font-medium text-[#46b7d7]">
                      {metric.unit}
                    </span>
                  )}
                </div>
                <p className="text-[#a6dbeb]">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section header */}
        {/* <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Trusted by design teams who value their time
          </h2>
        </div> */}

        {/* Testimonials */}
        {/* <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-[#0B294b]/80 border border-[#2b8ac4]/30 backdrop-blur-sm"
              >
                <blockquote className="text-[#a6dbeb] leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#46b7d7] to-[#2b8ac4]" />
                  <div>
                    <div className="text-white font-medium">{testimonial.author}</div>
                    <div className="text-sm text-[#a6dbeb]">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Trust indicators */}
        {/* <div className="mt-16 lg:mt-20 pt-12 border-t border-[#2b8ac4]/30">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12 text-[#a6dbeb]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-sm">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}
