import { Users, Linkedin, Mail, Github } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
  linkedin?: string;
  email?: string;
  github?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Aldo Rios",
    role: "Co-Founder & Developer",
    image: "/team/aldo.png",
    // bio: "Aldo is driven by a simple goal: a solution for contract-based and growing teams that doesn't cost a fortune. With 5+ years in software development and plenty of enthusiasm, he's building MasterView Portals to be that option—focused on what actually helps, without the bloat or the premium price tag.",
    email: "aldo@masterviewportals.com",
    linkedin: "https://www.linkedin.com/in/aldo-rios369/"
  },
  {
    name: "Anna Babankova",
    role: "Co-Founder & Industry Consultant",
    // bio: "Sarah brings deep technical expertise to the team, having built scalable platforms for various industries. She ensures our technology stack is robust, secure, and ready to grow with our users.",
    email: "info@masterviewportals.com",
    // linkedin: "https://linkedin.com/in/sarahjohnson"
  },
  // {
  //   name: "Michael Chen",
  //   role: "Head of Product",
  //   bio: "Michael works closely with our industry partners to understand their needs and translate them into features. His background in product design ensures every feature we build is intuitive and valuable.",
  //   email: "michael@masterviewportals.com",
  //   linkedin: "https://linkedin.com/in/michaelchen"
  // }
];

export default function TeamPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main className="relative bg-[#e7ebed] overflow-hidden">
        {/* Unified background - continuous across title and body */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 bg-grid opacity-20"
        />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
          <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a6dbeb]/40 border border-[#a6dbeb] mb-6"
              >
                <Users className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Our Team
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight"
              >
                The people behind
                <span className="block text-[#2b8ac4]">MasterView Portals</span>
              </motion.h1>
            </motion.div>
          </div>
        </section>

        {/* Team Grid */}
        <section className="relative pt-8 pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div
              className={`grid gap-8 mx-auto ${
                teamMembers.length === 1
                  ? "max-w-md grid-cols-1"
                  : teamMembers.length === 2
                    ? "max-w-4xl grid-cols-1 sm:grid-cols-2"
                    : "max-w-6xl md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="border border-[#cfcfcf] hover:border-[#a6dbeb] transition-all duration-300 bg-white h-full">
                    <CardHeader>
                      {/* Avatar placeholder */}
                      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-gradient-to-br from-[#a6dbeb] to-[#2b8ac4] flex items-center justify-center mb-4 mx-auto shrink-0">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl sm:text-5xl font-bold text-white">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <CardTitle className="text-xl text-[#0B294b] mb-1">{member.name}</CardTitle>
                        <CardDescription className="text-[#2b8ac4] font-medium">
                          {member.role}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#617b5d] text-sm leading-relaxed mb-4 text-center">
                        {member.bio}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="w-8 h-8 rounded-full bg-[#e7ebed] hover:bg-[#a6dbeb]/40 flex items-center justify-center transition-colors"
                            aria-label={`Email ${member.name}`}
                          >
                            <Mail className="w-4 h-4 text-[#2b8ac4]" />
                          </a>
                        )}
                        {member.linkedin && (
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-[#e7ebed] hover:bg-[#a6dbeb]/40 flex items-center justify-center transition-colors"
                            aria-label={`${member.name} LinkedIn`}
                          >
                            <Linkedin className="w-4 h-4 text-[#2b8ac4]" />
                          </a>
                        )}
                        {member.github && (
                          <a
                            href={member.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-[#e7ebed] hover:bg-[#a6dbeb]/40 flex items-center justify-center transition-colors"
                            aria-label={`${member.name} GitHub`}
                          >
                            <Github className="w-4 h-4 text-[#2b8ac4]" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
