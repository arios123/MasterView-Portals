import { navigationSections } from "./navigationData";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                {section.title}
              </h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-xs sm:text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-slate-800 pt-6 sm:pt-8 text-center">
          <p className="text-xs sm:text-sm">
            © {currentYear} MasterView Portals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

