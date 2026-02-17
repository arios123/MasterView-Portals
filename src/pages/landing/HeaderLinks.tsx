import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { navigationSections } from "./navigationData";

export function HeaderLinks() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
        {/* Company name on left */}
        <Link to="/" className="text-lg font-semibold whitespace-nowrap hover:text-white transition cursor-pointer">
          MasterView Portals
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <>
            <nav className="flex-1 flex items-center justify-center gap-6 text-sm">
              {navigationSections.map((section) => (
                <div
                  key={section.title}
                  className="relative"
                  onMouseEnter={() => setOpenSection(section.title)}
                  onMouseLeave={() => setOpenSection(null)}
                >
                  <button
                    className="flex items-center gap-2 font-medium text-slate-100 hover:text-white transition"
                    onMouseEnter={() => setOpenSection(section.title)}
                  >
                    {section.title}
                    <span className="inline-block h-1 w-1 rounded-full bg-emerald-400" />
                  </button>
                  <div
                    className={`absolute left-0 top-full min-w-[180px] rounded-md border border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur-sm transition ${
                      openSection === section.title ? "block" : "hidden"
                    }`}
                    onMouseEnter={() => setOpenSection(section.title)}
                  >
                    <div className="p-3 space-y-1">
                      {section.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="block rounded px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-100 hover:text-white hover:bg-slate-800 transition"
              >
                Log in
              </a>
              <a
                href="/register"
                className="px-3 py-2 rounded-md text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition shadow-sm"
              >
                Sign up
              </a>
            </div>
          </>
        )}

        {/* Mobile Navigation - Hamburger Menu on Right */}
        {isMobile && (
          <>
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-100 hover:text-white hover:bg-slate-800 transition"
              >
                Log in
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="text-slate-100 hover:text-white hover:bg-slate-800"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu Sheet */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetContent side="right" className="w-[300px] bg-slate-900 text-slate-100 border-slate-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {navigationSections.map((section) => (
                      <AccordionItem key={section.title} value={section.title} className="border-slate-800">
                        <AccordionTrigger className="text-slate-100 hover:text-white py-3">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-1 pl-2">
                            {section.links.map((link) => (
                              <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {/* Sign up button in mobile menu */}
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <a
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 rounded-md text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition shadow-sm text-center"
                    >
                      Sign up
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </header>
  );
}

