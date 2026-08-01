import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Developer Docs | NetGoat",
};

const sections = [
  {
    title: "Getting Started",
    items: [
      { label: "Create a Publisher Profile", desc: "Set up your public identity and request verification." },
      { label: "Create a Plugin Draft", desc: "Describe your extension, category, and behavior." },
      { label: "Submit a Release", desc: "Attach a descriptor SHA-256 and submit for review." },
    ],
  },
  {
    title: "Platform Concepts",
    items: [
      { label: "Immutable Releases", desc: "Releases are descriptors only — no source code or binaries are accepted." },
      { label: "Publisher Verification", desc: "Manual admin review of your identity and support channels." },
      { label: "Credibility Score", desc: "An informational signal based on verification, releases, and installs." },
    ],
  },
  {
    title: "Technical Reference",
    items: [
      { label: "Descriptor SHA-256", desc: "A 64-character hex string that binds a release to a compiled descriptor." },
      { label: "Factory IDs", desc: "Built-in middleware factories like builtin.noop that agents recognize." },
      { label: "Granted Capabilities", desc: "Permissions like request.read, route.read, and response.write." },
      { label: "Manifest Format", desc: "The JSON structure that describes a plugin's factory, capabilities, and config." },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-2">
          <BookOpen size={16} /> Developer Documentation
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Guide</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-2xl">
          Everything you need to build, publish, and manage plugins on the NetGoat edge.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-medium text-neutral-300">{item.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-3">Quick Start</h2>
        <div className="space-y-3 text-sm text-neutral-400">
          <p>
            The NetGoat Developer Platform allows you to publish descriptors for middleware 
            factories that are already compiled into NetGoat agents. This approach means:
          </p>
          <ul className="space-y-2 list-disc list-inside text-neutral-500">
            <li>No source code, URLs, or binaries are ever uploaded to the catalog</li>
            <li>Each release is bound to a specific descriptor via its SHA-256 hash</li>
            <li>Teams install approved releases, and admins deploy them to the fleet</li>
            <li>Publisher profiles are manually verified to establish trust</li>
          </ul>
          <p>
            Start by creating a <Link href="/developers/publisher" className="text-sky-400 hover:text-sky-300 transition-colors">publisher profile</Link>, 
            then head to the <Link href="/developers/plugins" className="text-sky-400 hover:text-sky-300 transition-colors">plugins section</Link> 
            to create your first plugin draft and release.
          </p>
        </div>
      </div>
    </div>
  );
}
