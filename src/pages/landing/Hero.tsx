import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
        <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 md:py-0">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Manage Your Design Projects
            <span className="block text-slate-200 mt-2">With Confidence</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            The all-in-one project management platform for renovation and design teams. 
            Streamline quotes, track projects, manage clients, and stay organized.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4 px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => navigate("/register")}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-white text-slate-900 border-white/30 hover:bg-slate-900 hover:text-white transition-all duration-200"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
          
          <p className="text-xs sm:text-sm text-slate-300">
            Try for free for a month
          </p>

        </div>
      </div>
    </section>
  );
}

