import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "30-day free trial",
  "Full access to all features",
  "Export your data anytime"
];

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#a6dbeb]/30 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#e7ebed] rounded-full blur-3xl opacity-50" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA card */}
          <div className="relative">
            {/* Glass effect behind */}
            <div className="absolute -inset-4 glass rounded-3xl opacity-50" />
            
            <div className="relative bg-white rounded-2xl shadow-smooth-lg border border-[#cfcfcf] p-8 lg:p-12 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6">
                Start managing contracts
                <span className="block text-[#2b8ac4]">the way they should be managed</span>
              </h2>
              
              <p className="text-lg text-[#617b5d] leading-relaxed max-w-2xl mx-auto mb-8">
                Join teams who've moved from spreadsheets, fragmented tools, and ERP headaches 
                to one connected workflow that actually fits how they work.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap justify-center gap-4 lg:gap-6 mb-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-[#617b5d]">
                    <CheckCircle2 className="w-5 h-5 text-[#2b8ac4]" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="text-base px-8 py-6 rounded-xl bg-[#2b8ac4] hover:bg-[#46b7d7] text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  onClick={() => navigate("/register")}
                >
                  Start your free trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 rounded-xl bg-transparent text-[#0B294b] border-[#cfcfcf] hover:bg-[#e7ebed] hover:border-[#8b8b8b] transition-all duration-200"
                  onClick={() => window.open('https://demo.masterviewportals.com', '_blank')}
                >
                  Explore live demo
                </Button>
              </div>

              {/* Trust note */}
              <p className="mt-8 text-sm text-[#8b8b8b]">
                Questions? <a href="/support" className="text-[#2b8ac4] hover:text-[#46b7d7] underline-offset-4 hover:underline">Talk to our team</a> — we're real humans who use the product daily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

