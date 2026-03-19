"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Edit,
} from "lucide-react";
import {
  getUsers,
  updateUser,
} from "@/actions/adminValues";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  banned: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations("DashboardPages.admin.users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers(userPage, 10, userSearch);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (error) {
      console.log(error)
      toast.error(t("toasts.fetchFailed"));
    } finally {
      setLoadingUsers(false);
    }
  }, [t, userPage, userSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser._id, editingUser);
      toast.success(t("toasts.updateSuccess"));
      setIsEditUserOpen(false);
      fetchUsers();
    } catch (error) {
      console.log(error)
      toast.error(t("toasts.updateFailed"));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>{t("directory.title")}</CardTitle>
          <CardDescription>{t("directory.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("searchPlaceholder")} 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="max-w-sm" 
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.user")}</TableHead>
                <TableHead>{t("table.role")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-37.5 mb-1" />
                      <Skeleton className="h-3 w-50" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-25" /></TableCell>
                    <TableCell className="text-right">
                       <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t(`roles.${u.role}`)}</Badge></TableCell>
                  <TableCell>
                    {u.banned ? <Badge variant="destructive">{t("status.banned")}</Badge> : <Badge variant="secondary">{t("status.active")}</Badge>}
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setEditingUser(u);
                      setIsEditUserOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUserPage(p => Math.max(1, p - 1))}
              disabled={userPage === 1}
            >
              {t("pagination.previous")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUserPage(p => p + 1)}
              disabled={users.length < 10 && userPage >= totalPages}
            >
              {t("pagination.next")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editUser.title")}</DialogTitle>
            <DialogDescription>{t("editUser.description")}</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">{t("fields.name")}</Label>
                <Input id="name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">{t("fields.email")}</Label>
                <Input id="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">{t("fields.role")}</Label>
                <Select value={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: (v ?? "user") as AdminUser["role"] })}>
                  <SelectTrigger className="col-span-3">
                     <SelectValue placeholder={t("fields.selectRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">{t("roles.user")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banned" className="text-right">{t("fields.banned")}</Label>
                <div className="flex items-center col-span-3">
                   <Switch id="banned" checked={editingUser.banned} onCheckedChange={(c) => setEditingUser({...editingUser, banned: c})} />
                   <span className="ml-2 text-sm text-neutral-500">{editingUser.banned ? t("yes") : t("no")}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={loadingUsers}>{t("actions.saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
