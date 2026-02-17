import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const YOUTUBE_TUTORIALS = [
  {
    id: 1,
    title: "Overview",
    youtubeId: "bph3JdImP9Y",
    description:
      "High-level tour of MasterView Portals, including main navigation and the projects board.",
  },
  {
    id: 2,
    title: "Client Profile",
    youtubeId: "bXDraJXJeBE",
    description:
      "Deep dive into the client profile: activity, contract builder, change orders, materials, and payments.",
  },
  {
    id: 3,
    title: "Admin Tab",
    youtubeId: "mfXhqwX_aiw",
    description:
      "Walkthrough of the Admin tab, workspace setup, staff management, and roles & permissions.",
  },
  {
    id: 4,
    title: "Document Generation",
    youtubeId: "hdVVk_ibncY",
    description:
      "How to set up document templates, use placeholders, and generate client-ready contracts.",
  },
  {
    id: 5,
    title: "Miscellaneous",
    youtubeId: "-CJTS10KMlU",
    description:
      "Quick tips, client view toggle, delete buttons, manage subscriptions, and other helpful details.",
  },
];

export default function VideoTutorialsPage() {
  return (
    <div className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* Hero + Video Tutorials (continuous background) */}
        <section className="relative overflow-hidden bg-[#e7ebed] pt-24 pb-24">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Page Title */}
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-[#0B294b] mb-4">
                Video Tutorials
              </h1>
              <p className="text-[#617b5d] mb-2">
                Watch the core tutorials — learn the full system fast.
              </p>
              <p className="text-sm text-[#617b5d]/80">
                5 embedded walkthroughs
              </p>
            </div>

            {/* Video Tutorials */}
            <div className="mt-12 space-y-8 lg:space-y-10">
              {YOUTUBE_TUTORIALS.map((tutorial, index) => {
                const isEven = index % 2 === 0;

                return (
                  <Card
                    key={tutorial.id}
                    className="bg-white border border-[#cfcfcf] shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-6 lg:p-8">
                      <div
                        className={`flex flex-col items-center gap-8 lg:gap-10 ${
                          isEven ? "md:flex-row" : "md:flex-row-reverse"
                        }`}
                      >
                        {/* Video */}
                        <div className="w-full md:w-1/2">
                          <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden shadow-sm">
                            <iframe
                              src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                              title={tutorial.title}
                              className="absolute inset-0 h-full w-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        </div>

                        {/* Text */}
                        <div className="w-full md:w-1/2 space-y-3">
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                          >
                            Tutorial {tutorial.id} of {YOUTUBE_TUTORIALS.length}
                          </Badge>
                          <h2 className="text-xl font-semibold text-[#0B294b]">
                            {tutorial.title}
                          </h2>
                          <p className="text-sm md:text-base text-[#617b5d]">
                            {tutorial.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
