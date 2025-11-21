"use client";

import { useEffect, useState } from "react";
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
import MonacoEditor from "@monaco-editor/react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import vscDarkPlus from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

const API_BASE = process.env.NEXT_PUBLIC_BACKENDAPI || "";

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
        {rule.description}
        {rule.code && (
          <div className="mt-2 rounded bg-muted p-2 overflow-x-auto">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{
                background: "transparent",
                fontSize: 13,
                margin: 0,
                padding: 0,
              }}
            >
              {String(rule.code)}
            </SyntaxHighlighter>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={rule.status}
          onCheckedChange={() => toggleRule(rule.id)}
        />
        <span
          className={`ml-2 ${
            rule.status ? "text-green-500" : "text-red-500"
          }`}
        >
          {rule.status ? "On" : "Off"}
        </span>
      </TableCell>
    </motion.tr>
  );
}

export default function WAFPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
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

  useEffect(() => {
    (async () => {
      const resolved = await params;
      setSlug(resolved.slug);
    })();
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    const fetchRules = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
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
    if (!newRule.name.trim() || !newRule.code.trim() || !slug) return;
    const token = localStorage.getItem("token");
    try {
      const upload = await fetch(`${API_BASE}/api/waf/rules/${await params.slug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRule.name.replace(/\s+/g, "_"),
          domain: await params.slug,
          slug: newRule.slug,
          code: newRule.code,
        }),
      });
      const res1 = await upload.json();
      if (!upload.ok) throw new Error(res1.error);
      
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
                <span
                  className={enabled ? "text-green-500" : "text-red-500"}
                >
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
                    onClick={() => setDrawerOpen(true)}
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
                          placeholder="Rule name"
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
                          placeholder="Slug"
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
                        <Button onClick={addRule}>Add Rule</Button>
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
                          {rules.map((rule) => {
                            const {
                              setNodeRef,
                              attributes,
                              listeners,
                              isDragging,
                              transform,
                              transition,
                            } = useSortable({ id: rule.id });
                            return (
                              <DraggableRow
                                key={rule.id}
                                rule={rule}
                                ref={setNodeRef}
                                listeners={listeners}
                                attributes={attributes}
                                isDragging={isDragging}
                                toggleRule={toggleRule}
                                transform={transform}
                                transition={transition}
                              />
                            );
                          })}
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
