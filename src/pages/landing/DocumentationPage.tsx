import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { HeaderLinks } from "./HeaderLinks";
import documentationContent from "./documentation.md?raw";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

interface NavigationGroup {
  id: string;
  label: string;
  collapsible: boolean;
  subsections: { id: string; text: string }[];
}

interface DocumentationItem {
  id: string;
  heading: string;
  description: string;
}

interface DocumentationSection {
  id: string;
  title: string;
  isIntroduction: boolean;
  description?: string;
  items: DocumentationItem[];
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(["introduction", "you-client", "project-info", "materials-labor", "payments", "miscellaneous"])
  );
  const [navigationGroups, setNavigationGroups] = useState<NavigationGroup[]>([
    { id: "introduction", label: "Introduction", collapsible: true, subsections: [] },
    { id: "you-client", label: "You & Client", collapsible: true, subsections: [] },
    { id: "project-info", label: "Project Info", collapsible: true, subsections: [] },
    { id: "materials-labor", label: "Materials & Labor", collapsible: true, subsections: [] },
    { id: "payments", label: "Payments", collapsible: true, subsections: [] },
    { id: "miscellaneous", label: "Miscellaneous", collapsible: true, subsections: [] },
  ]);

  // Parse markdown content into structured sections
  const parsedSections = useMemo(() => {
    const lines = documentationContent.split("\n");
    const sections: DocumentationSection[] = [];
    let currentSection: DocumentationSection | null = null;
    let currentItem: DocumentationItem | null = null;
    const descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);

      if (h2Match) {
        // Save previous item's description if exists
        if (currentItem) {
          currentItem.description = descriptionLines.join("\n").trim();
          descriptionLines.length = 0;
        } else if (currentSection && descriptionLines.length > 0) {
          // Save section-level description if no item was created yet
          currentSection.description = descriptionLines.join("\n").trim();
          descriptionLines.length = 0;
        }
        
        // New section
        currentItem = null;
        const title = h2Match[1].trim();
        currentSection = {
          id: slugify(title),
          title,
          isIntroduction: title.toLowerCase() === "introduction",
          items: [],
        };
        sections.push(currentSection);
      } else if (h3Match && currentSection) {
        // Save section description if we haven't created an item yet
        if (!currentItem && descriptionLines.length > 0) {
          currentSection.description = descriptionLines.join("\n").trim();
          descriptionLines.length = 0;
        }
        
        // Save previous item's description if exists
        if (currentItem) {
          currentItem.description = descriptionLines.join("\n").trim();
          descriptionLines.length = 0;
        }
        
        // New item within current section
        const heading = h3Match[1].trim();
        currentItem = {
          id: slugify(heading),
          heading,
          description: "",
        };
        currentSection.items.push(currentItem);
      } else if (currentItem || currentSection) {
        // Collect all lines for description (including empty lines and code blocks)
        descriptionLines.push(line);
      }
    }
    
    // Save last item's description
    if (currentItem) {
      currentItem.description = descriptionLines.join("\n").trim();
    } else if (currentSection && descriptionLines.length > 0) {
      // Save section-level description if no items were created
      currentSection.description = descriptionLines.join("\n").trim();
    }

    // Set default description for items without one
    sections.forEach(section => {
      section.items.forEach(item => {
        if (!item.description) {
          item.description = "Description placeholder";
        }
      });
    });

    return sections;
  }, []);

  // Populate navigation groups with subsections from parsed content
  useEffect(() => {
    const updatedGroups = navigationGroups.map(group => {
      // Find the corresponding parsed section
      const section = parsedSections.find(s => s.id === group.id);
      
      if (section) {
        // Show ALL items in navigation (both with and without *)
        const allItems = section.items.map(item => ({
          id: item.id,
          text: item.heading
        }));
        
        return {
          ...group,
          subsections: allItems
        };
      }
      
      return group;
    });
    
    setNavigationGroups(updatedGroups);
  }, [parsedSections]);

  // Set initial active section from hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveSection(hash);
      scrollToSection(hash);
    }
  }, []);

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveSection(hash);
        scrollToSection(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Helper function to create URL-friendly slugs
  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Scroll to section
  const scrollToSection = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }, 50);
  };

  // Toggle group collapse state
  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle group header click
  const handleGroupClick = (groupId: string, collapsible: boolean) => {
    if (collapsible) {
      // Just toggle collapse for collapsible groups
      toggleGroup(groupId);
    }
    // For Introduction (non-collapsible), we could scroll to a section if needed
  };

  // Handle subsection click
  const handleSubsectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
    scrollToSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <div className="flex min-h-[calc(100vh-88px)]">
        {/* Sidebar Navigation — 88px matches fixed header height (logo + padding) */}
        <aside className="sticky top-[88px] self-start w-52 h-[calc(100vh-88px)] border-slate-200 bg-[#e7ebed] flex-shrink-0">
          <ScrollArea className="h-full">
            <nav className="p-4 space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Doc Generator Guide</h2>
                <ul className="space-y-1">
                  {navigationGroups.map((group) => {
                    const isCollapsed = collapsedGroups.has(group.id);
                    
                    return (
                      <li key={group.id}>
                        <button
                          onClick={() => handleGroupClick(group.id, group.collapsible)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                            "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {group.collapsible && (
                            isCollapsed ? (
                              <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 flex-shrink-0" />
                            )
                          )}
                          <span>{group.label}</span>
                        </button>
                        
                        {/* Subsections - show all items from this section */}
                        {!isCollapsed && group.subsections.length > 0 && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {group.subsections.map((subsection) => (
                              <li key={subsection.id}>
                                <button
                                  onClick={() => handleSubsectionClick(subsection.id)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                                    activeSection === subsection.id
                                      ? "bg-slate-200 text-slate-900 font-medium"
                                      : "text-slate-600 hover:bg-slate-100"
                                  )}
                                >
                                  {subsection.text}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {/* Footer note about macros */}
              <div className="mt-6 pt-4 border-t border-slate-300 px-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold">*</span> Macro's are more complicated, see that macro for more information.
                </p>
              </div>
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#e7ebed]">
          <div className="max-w-6xl mx-auto px-8 pt-24 pb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-8 pb-3 border-b border-slate-200">
              Doc Generator Guide
            </h1>
            
            {parsedSections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                  {section.title}
                </h2>
                
                {section.isIntroduction ? (
                  // Introduction: Show section description + subsections
                  <div className="space-y-8">
                    {/* Section-level description */}
                    {section.description && (
                      <div className="prose prose-slate prose-lg max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-blue-600 hover:text-blue-800 underline cursor-pointer" />
                            ),
                          }}
                        >
                          {section.description}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Subsections */}
                    {section.items.length > 0 && (
                      <div className="space-y-6">
                        {section.items.map((item) => (
                          <div key={item.id} id={item.id} className="scroll-mt-20 space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {item.heading}
                            </h3>
                            <div className="text-sm text-slate-600 prose prose-sm max-w-none">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  p: ({ node, ...props }) => (
                                    <p {...props} className="text-slate-700 leading-relaxed" />
                                  ),
                                  a: ({ node, ...props }) => (
                                    <a {...props} className="text-blue-600 hover:text-blue-800 underline cursor-pointer" />
                                  ),
                                  code: ({ node, ...props }) => {
                                    const inline = !props.className;
                                    return inline ? (
                                      <code {...props} className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono" />
                                    ) : (
                                      <code {...props} className="text-slate-900 font-mono text-xs" />
                                    );
                                  },
                                }}
                              >
                                {item.description}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // All other sections: Separate grid items and macro items
                  <>
                    {/* Regular items (without *): Grid layout */}
                    {section.items.filter(item => !item.heading.includes('*')).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {section.items
                          .filter(item => !item.heading.includes('*'))
                          .map((item) => (
                            <div key={item.id} id={item.id} className="scroll-mt-20 space-y-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {item.heading}
                              </h3>
                              <div className="text-sm text-slate-600 prose prose-sm max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm, remarkBreaks]}
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    p: ({ node, ...props }) => (
                                      <p {...props} className="text-slate-700 leading-relaxed" />
                                    ),
                                    a: ({ node, ...props }) => (
                                      <a {...props} className="text-blue-600 hover:text-blue-800 underline cursor-pointer" />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul {...props} className="list-disc list-outside ml-5 space-y-1 text-slate-700" />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol {...props} className="list-decimal list-outside ml-5 space-y-1 text-slate-700" />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li {...props} className="pl-1" />
                                    ),
                                  }}
                                >
                                  {item.description}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* Macro items (with *): Full-width layout */}
                    {section.items.filter(item => item.heading.includes('*')).length > 0 && (
                      <div className="space-y-6">
                        {section.items
                          .filter(item => item.heading.includes('*'))
                          .map((item) => (
                            <div key={item.id} id={item.id} className="scroll-mt-20 space-y-2">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {item.heading}
                              </h3>
                              <div className="text-sm text-slate-600 prose prose-sm max-w-none">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm, remarkBreaks]}
                                  rehypePlugins={[rehypeRaw]}
                                  components={{
                                    p: ({ node, ...props }) => (
                                      <p {...props} className="text-slate-700 leading-relaxed mb-3" />
                                    ),
                                    a: ({ node, ...props }) => (
                                      <a {...props} className="text-blue-600 hover:text-blue-800 underline cursor-pointer" />
                                    ),
                                    ul: ({ node, ...props }) => (
                                      <ul {...props} className="list-disc list-outside ml-5 space-y-1 mb-3 text-slate-700" />
                                    ),
                                    ol: ({ node, ...props }) => (
                                      <ol {...props} className="list-decimal list-outside ml-5 space-y-1 mb-3 text-slate-700" />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li {...props} className="pl-1" />
                                    ),
                                    pre: ({ node, ...props }) => (
                                      <pre {...props} className="bg-slate-100 p-4 rounded-lg overflow-x-auto text-xs my-3" />
                                    ),
                                    code: ({ node, ...props }) => {
                                      const inline = !props.className;
                                      return inline ? (
                                        <code {...props} className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono" />
                                      ) : (
                                        <code {...props} className="text-slate-900 font-mono text-xs" />
                                      );
                                    },
                                  }}
                                >
                                  {item.description}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

