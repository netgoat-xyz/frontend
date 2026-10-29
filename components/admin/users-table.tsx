"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Edit02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { saveAdminUserAction } from "@/actions/admin-users";
import { FormError } from "@/components/auth/auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast";
import type { AdminUserRow } from "@/lib/data/admin-users";
import { formatDateTime } from "@/lib/format";

const ROLE_ITEMS = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
];

type EditState = {
  user: AdminUserRow;
  name: string;
  email: string;
  role: "user" | "admin";
  banned: boolean;
  banReason: string;
};

/** User table with debounced server-side search, pagination and a safe editor. */
export function AdminUsersTable({
  users,
  total,
  page,
  pages,
  query,
}: {
  users: AdminUserRow[];
  total: number;
  page: number;
  pages: number;
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(query);
  }, [query]);

  function navigate(nextQuery: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const suffix = params.toString();
    router.replace(suffix ? `/admin/users?${suffix}` : "/admin/users");
  }

  function onSearchChange(value: string) {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate(value, 1), 400);
  }

  async function save() {
    if (!edit) return;
    setPending(true);
    setError(null);

    const result = await saveAdminUserAction({
      userId: edit.user.id,
      name: edit.name,
      email: edit.email,
      role: edit.role,
      banned: edit.banned,
      banReason: edit.banReason || undefined,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    toastManager.add({
      type: "success",
      title: "User updated",
      description: edit.banned
        ? "Sessions were revoked; the ban applies immediately."
        : "Changes are live.",
    });
    setEdit(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <HugeiconsIcon
            icon={Search01Icon}
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            className="ps-8"
          />
        </div>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} user{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="w-[110px]">Role</TableHead>
              <TableHead className="w-[160px]">Status</TableHead>
              <TableHead className="hidden w-[130px] md:table-cell">
                Created
              </TableHead>
              <TableHead className="w-[80px] text-end">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  {query
                    ? `No users match “${query}”.`
                    : "No users registered yet."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {user.name}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                        {user.email}
                        {!user.emailVerified ? (
                          <Badge variant="outline" className="text-[10px]">
                            unverified
                          </Badge>
                        ) : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "info" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <span className="flex flex-col gap-0.5">
                        <Badge variant="error">Banned</Badge>
                        {user.banReason ? (
                          <span className="text-muted-foreground truncate text-[11px]">
                            {user.banReason}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs md:table-cell">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${user.email}`}
                      onClick={() =>
                        setEdit({
                          user,
                          name: user.name,
                          email: user.email,
                          role: user.role,
                          banned: user.banned,
                          banReason: user.banReason ?? "",
                        })
                      }
                    >
                      <HugeiconsIcon icon={Edit02Icon} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Page {page} of {pages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate(search, page - 1)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => navigate(search, page + 1)}
          >
            Next
            <HugeiconsIcon icon={ArrowRight01Icon} />
          </Button>
        </div>
      </div>

      <Dialog
        open={edit !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEdit(null);
            setError(null);
          }
        }}
      >
        <DialogPopup className="max-w-lg">
          {edit ? (
            <>
              <DialogHeader>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>
                  Changes apply immediately. Banning revokes every active
                  session.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-5 py-2">
                <Field>
                  <FieldLabel htmlFor="admin-user-name">Name</FieldLabel>
                  <Input
                    id="admin-user-name"
                    value={edit.name}
                    onChange={(event) =>
                      setEdit({ ...edit, name: event.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="admin-user-email">Email</FieldLabel>
                  <Input
                    id="admin-user-email"
                    type="email"
                    value={edit.email}
                    onChange={(event) =>
                      setEdit({ ...edit, email: event.target.value })
                    }
                  />
                  <FieldDescription>
                    Changing the email marks it unverified again.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    items={ROLE_ITEMS}
                    value={edit.role}
                    onValueChange={(next) =>
                      setEdit({
                        ...edit,
                        role: (next as "user" | "admin") ?? "user",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectPopup>
                      {ROLE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Ban this account</FieldLabel>
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={edit.banned}
                      onCheckedChange={(checked) =>
                        setEdit({ ...edit, banned: checked })
                      }
                      aria-label="Ban this account"
                    />
                  </div>
                </Field>

                {edit.banned ? (
                  <Field>
                    <FieldLabel htmlFor="admin-user-ban-reason">
                      Ban reason
                    </FieldLabel>
                    <Input
                      id="admin-user-ban-reason"
                      maxLength={280}
                      value={edit.banReason}
                      onChange={(event) =>
                        setEdit({ ...edit, banReason: event.target.value })
                      }
                      placeholder="Shown to the user on the suspended page"
                    />
                  </Field>
                ) : null}

                <FormError message={error} />
              </div>

              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>
                  Cancel
                </DialogClose>
                <Button disabled={pending} onClick={save}>
                  {pending ? <Spinner className="size-4" /> : null}
                  Save changes
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogPopup>
      </Dialog>
    </>
  );
}
