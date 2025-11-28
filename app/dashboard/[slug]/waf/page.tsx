"use client";

import { useEffect, useState, use } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import config from "../../../../public/config.json";

// Assuming these are locally installed and configured
// import MonacoEditor from "@monaco-editor/react";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

// --- Type Definitions for Placeholder Components ---
interface MonacoEditorProps {
  height: string;
  defaultLanguage: string;
  value: string;
  onChange: (code: string) => void;
  options: any; // Simplified type for options
  theme: string;
}

interface SyntaxHighlighterProps {
  language: string;
  style: any; // Simplified type for style object
  customStyle: any;
  children: React.ReactNode;
}
// ---------------------------------------------------

// Placeholder components for the missing dependencies (Now with explicit types)
const MonacoEditor = ({
  height,
  defaultLanguage,
  value,
  onChange,
  options,
  theme,
}: MonacoEditorProps) => (
  <textarea
    style={{
      height,
      width: "100%",
      minHeight: "160px",
      border: "1px solid #333",
      padding: "8px",
      backgroundColor: "#1e1e1e",
      color: "#d4d4d4",
      fontFamily: "monospace",
    }}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={`Code Editor Placeholder (${defaultLanguage})`}
  />
);
const SyntaxHighlighter = ({
  language,
  style,
  customStyle,
  children,
}: SyntaxHighlighterProps) => (
  <pre
    style={{
      ...customStyle,
      backgroundColor:
        style?.['code[class*="language-"]']?.background || "#2d2d2d",
      color: style?.['code[class*="language-"]']?.color || "#cccccc",
    }}
  >
    {children}
  </pre>
);
const vscDarkPlus = {
  'code[class*="language-"]': { background: "#1e1e1e", color: "#d4d4d4" },
};

const API_BASE = config.backend || "";

function DraggableRow({
  rule,
  listeners,
  attributes,
  isDragging,
  toggleRule,
  ref,
  style,
  transform,
  transition,
}: any) {
  return (
    <motion.tr
      ref={ref}
      layout
      animate={{
        scale: isDragging ? 1.04 : 1,
        y: transform ? transform.y : 0,
        boxShadow: isDragging
          ? "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
          : "0 0px 0px 0 rgba(0,0,0,0)",
        opacity: isDragging ? 0.7 : 1,
        backgroundColor: isDragging ? "rgba(255,255,255,0.04)" : "unset",
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        ...transition,
      }}
      style={{
        cursor: "grab",
        position: isDragging ? "relative" : undefined,
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      <TableCell className="font-medium flex items-center gap-2">
        <GripVertical size={16} className="text-muted-foreground" />
        {rule.name}
      </TableCell>
      <TableCell>
        waf
      </TableCell>
      <TableCell>
        <Switch
          checked={rule.status}
          onCheckedChange={() => toggleRule(rule.id)}
        />
        <span
          className={`ml-2 ${rule.status ? "text-green-500" : "text-red-500"}`}
        >
          {rule.status ? "On" : "Off"}
        </span>
      </TableCell>
    </motion.tr>
  );
}

// 1. Resolve params promise once at the top
// This avoids repeated promise access warnings and simplifies component logic
export default function WAFPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const initialSlug = resolvedParams.slug;

  // Set slug state directly from the resolved value
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    slug: "",
    code: "",
  });

  const sensors = useSensors(useSensor(PointerSensor));

  // Remove the initial useEffect that was only resolving the promise
  // useEffect(() => {
  //   (async () => {
  //     const resolved = await params;
  //     setSlug(resolved.slug);
  //   })();
  // }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchRules = async () => {
      try {
        setLoading(true);
        // 2. Add token check for initial fetch
        const token = localStorage.getItem("jwt");
        if (!token) {
          console.warn("Authentication token missing. Cannot fetch WAF rules.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/waf/rules/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const domainRules = data.flat().map((r: any, idx: number) => ({
            id: idx + 1,
            name: r.name || `Rule ${idx + 1}`,
            description: r.description || "",
            code: r.code || "",
            status: true,
          }));
          setRules(domainRules);
        }
      } catch (e) {
        console.error("Error fetching WAF rules:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, [slug]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        // NOTE: A PUT request to update the order in the DB would go here.
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleRule = (id: number) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, status: !rule.status } : rule
      )
    );
  };

  const addRule = async () => {
    // 3. Robust check for slug and token to prevent "jwt malformed"
    if (!newRule.name.trim() || !newRule.code.trim() || !slug) return;

    const token = localStorage.getItem("jwt");
    if (!token) {
      console.error("Failed to add rule: Authentication token not found.");
      return;
    }

    try {
      // Use the 'slug' state variable instead of re-accessing the 'params' promise
      const upload = await fetch(`${API_BASE}/api/waf/rules/${slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRule.name.trim(), // Use trim for cleaner data
          domain: slug, // The domain is the slug
          slug: newRule.slug || "@", // Ensure slug is set, default to @
          code: newRule.code,
          description: newRule.description,
        }),
      });
      const res1 = await upload.json();
      if (!upload.ok)
        throw new Error(res1.error || "Failed to add rule on server.");

      setRules((prev) => [
        ...prev,
        {
          id: prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1,
          name: newRule.name,
          description: newRule.description,
          slug: newRule.slug,
          code: newRule.code,
          status: true,
        },
      ]);
      setDrawerOpen(false);
      setNewRule({ name: "", description: "", slug: "", code: "" });
    } catch (err: any) {
      // Improved error logging
      console.error("Failed to add rule:", err.message);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WAF Protection</CardTitle>
                <CardDescription>
                  Toggle global WAF protection or manage individual rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <span className="font-medium text-lg">WAF Status:</span>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <span className={enabled ? "text-green-500" : "text-red-500"}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WAF Rules</CardTitle>
                <CardDescription>
                  Enable, disable, reorder, or add new protections.
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Top = First to execute, Bottom = Last to execute
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                  <Button
                    onClick={() => {
                      setDrawerOpen(true);
                      setNewRule((r) => ({ ...r, slug: initialSlug })); // Pre-fill slug for convenience
                    }}
                    className="w-full md:w-auto"
                  >
                    Add Rule
                  </Button>
                </div>

                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Add WAF Rule</DrawerTitle>
                      <DrawerDescription>
                        Define new WAF logic. Code runs in your WAF sandbox.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-col gap-4 p-4">
                      <div className="flex flex-row gap-2">
                        <Input
                          placeholder="Rule name (e.g., BlockBadBots)"
                          value={newRule.name}
                          onChange={(e) =>
                            setNewRule((r) => ({
                              ...r,
                              name: e.target.value,
                            }))
                          }
                          className="w-full"
                        />
                        <Input
                          placeholder="Description"
                          value={newRule.description}
                          onChange={(e) =>
                            setNewRule((r) => ({
                              ...r,
                              description: e.target.value,
                            }))
                          }
                          className="w-1/2"
                        />
                        <Input
                          placeholder="Slug (e.g., app or @ for root)"
                          value={newRule.slug || "@"}
                          onChange={(e) =>
                            setNewRule((r) => ({
                              ...r,
                              slug: e.target.value,
                            }))
                          }
                          className="w-1/2"
                        />
                      </div>
                      <div className="w-full min-h-[120px] rounded border bg-background p-2 font-mono text-sm">
                        <MonacoEditor
                          height="160px"
                          defaultLanguage="javascript"
                          value={newRule.code}
                          onChange={(code) =>
                            setNewRule((r) => ({ ...r, code: code ?? "" }))
                          }
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            wordWrap: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                          }}
                          theme="vs-dark"
                        />
                      </div>
                      <DrawerFooter className="flex flex-row justify-end gap-2">
                        <Button
                          onClick={addRule}
                          disabled={
                            !newRule.name.trim() || !newRule.code.trim()
                          }
                        >
                          Add Rule
                        </Button>
                        <DrawerClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>

                {loading ? (
                  <div className="text-center text-muted-foreground py-4">
                    Loading rules...
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={rules.map((r) => r.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rule</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rules.map((rule) => (
                            <DraggableRow
                              key={rule.id}
                              rule={rule}
                              id={rule.id}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
