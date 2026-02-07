"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Edit,
} from "lucide-react";
import {
  getUsers,
  updateUser,
} from "@/actions/adminValues";
import { toast } from "sonner";
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers(userPage, 10, userSearch);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (e) {
      toast.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [userPage, userSearch]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser._id, editingUser);
      toast.success("User updated successfully");
      setIsEditUserOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage your users, roles, and access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="max-w-sm" 
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px] mb-1" />
                      <Skeleton className="h-3 w-[200px]" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
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
                  <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                  <TableCell>
                    {u.banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}
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
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUserPage(p => p + 1)}
              disabled={users.length < 10 && userPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user profile.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Select value={editingUser.role} onValueChange={(v) => setEditingUser({...editingUser, role: v})}>
                  <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="banned" className="text-right">Banned</Label>
                <div className="flex items-center col-span-3">
                   <Switch id="banned" checked={editingUser.banned} onCheckedChange={(c) => setEditingUser({...editingUser, banned: c})} />
                   <span className="ml-2 text-sm text-neutral-500">{editingUser.banned ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={loadingUsers}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
