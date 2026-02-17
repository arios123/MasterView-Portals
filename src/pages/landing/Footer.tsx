import { Link } from "react-router-dom";
import { navigationSections } from "./navigationData";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#e7ebed] border-t border-[#cfcfcf]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 lg:py-16">
          <div className="grid lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img
                  src="/MVP.png"
                  alt="MasterView Portals"
                  className="h-12 w-auto"
                />
                <span className="flex flex-col leading-tight text-lg font-semibold font-serif text-[#0B294b]">
                  <span>MasterView</span>
                  <span>Portals</span>
                </span>
              </Link>
              <p className="text-sm text-[#8b8b8b] leading-relaxed mb-6 max-w-xs">
                The project-to-contract workflow platform built for efficient businesses.
              </p>
              
              {/* Demo button */}
              <a
                href="https://demo.masterviewportals.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-colors"
              >
                Try live demo
              </a>
            </div>

            {/* Navigation columns */}
            {navigationSections.filter((section) => section.title !== "Tutorials").map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-[#0B294b] mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-[#8b8b8b] hover:text-[#0B294b] transition-colors"
                        {...(link.href.startsWith('http') ? {
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        } : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="py-6 border-t border-[#cfcfcf]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#8b8b8b]">
              © {currentYear} MasterView Portals. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="/privacy" className="text-sm text-[#8b8b8b] hover:text-[#0B294b] transition-colors">
                Privacy
              </a>
              <a href="/terms" className="text-sm text-[#8b8b8b] hover:text-[#0B294b] transition-colors">
                Terms
              </a>
              {/* <a href="/security" className="text-sm text-[#8b8b8b] hover:text-[#0B294b] transition-colors">
                Security
              </a> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

