import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join renovation and design teams who are already using our platform 
            to streamline their workflows and deliver exceptional results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => navigate("/login")}
            >
              Sign In to Your Account
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-slate-700"
              onClick={() => navigate("/register")}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

