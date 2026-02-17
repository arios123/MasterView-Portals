import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";

export default function TermsPage() {
  const [termsContent, setTermsContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the latest terms file
    // Automatically tries to find the latest version (terms_v1.txt, terms_v2.txt, etc.)
    const fetchTerms = async () => {
      try {
        setLoading(true);
        // Try versions starting from v10 down to v1 to find the latest
        let latestVersion = 1;
        let foundText: string | null = null;
        
        // Check for latest version (try up to v10)
        for (let v = 10; v >= 1; v--) {
          try {
            // Use absolute URL to avoid routing issues
            const url = `${window.location.origin}/terms_v${v}.txt`;
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'text/plain, text/*, */*',
              },
              cache: 'no-cache',
            });
            
            if (response.ok) {
              const text = await response.text();
              // Check if we got actual text, not HTML
              if (!text.trim().startsWith('<!DOCTYPE') && 
                  !text.trim().startsWith('<!doctype') && 
                  !text.trim().startsWith('<html') &&
                  text.trim().length > 0) {
                latestVersion = v;
                foundText = text;
                break;
              }
            }
          } catch (e) {
            // Continue to next version
            console.debug(`Version ${v} not found, trying next...`);
          }
        }
        
        if (!foundText) {
          throw new Error("No terms file found");
        }
        
        // Final check - ensure we have actual text content
        if (foundText.trim().startsWith('<!DOCTYPE') || 
            foundText.trim().startsWith('<!doctype') || 
            foundText.trim().startsWith('<html')) {
          console.error('Received HTML instead of text file');
          throw new Error("Terms file not found - received HTML response");
        }
        
        setTermsContent(foundText);
        setError(null);
      } catch (err: any) {
        console.error("Error loading terms:", err);
        setError(err.message || "Failed to load terms and conditions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-white animate-fade-in-up">
      <HeaderLinks />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute w-64 h-64 bg-emerald-400/30 blur-3xl rounded-full -top-10 -left-10" />
            <div className="absolute w-80 h-80 bg-cyan-400/25 blur-3xl rounded-full bottom-0 right-10" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-semibold border border-white/10 mb-4">
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Terms and Conditions
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl mx-auto">
                Please read our terms and conditions carefully before using our services.
              </p>
            </div>
          </div>
        </section>

        {/* Terms Content Section */}
        <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <span className="ml-3 text-slate-200">Loading terms and conditions...</span>
                </div>
              ) : error ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
                  <p className="text-red-200">{error}</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-lg max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-slate-200 leading-relaxed text-sm md:text-base">
                    {termsContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

