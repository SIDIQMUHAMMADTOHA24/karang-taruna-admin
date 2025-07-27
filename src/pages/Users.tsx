import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface User {
  id: number;
  nama: string;
  image_url?: string;
  jabatan_id?: number;
  jabatan?: string;
  level?: number;
}

interface Jabatan {
  id: number;
  nama: string;
  level: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    image_url: "",
    jabatan_id: ""
  });

  const loadUsers = async () => {
    try {
      // Fetch users and jabatan separately since tables not in types
      const usersQuery = supabase.from('users' as any).select('*');
      const jabatansQuery = supabase.from('jabatan' as any).select('*');
      
      const [usersResult, jabatansResult] = await Promise.all([usersQuery, jabatansQuery]);

      if (usersResult.error || jabatansResult.error) {
        console.error('Database query failed:', usersResult.error || jabatansResult.error);
        toast.error('Gagal memuat data dari database');
        return;
      }

      const usersData = usersResult.data as any[];
      const jabatansData = jabatansResult.data as any[];

      const formattedUsers: User[] = (usersData || []).map((user: any) => {
        const jabatan = (jabatansData || []).find((j: any) => j.id === user.jabatan_id);
        return {
          id: user.id,
          nama: user.nama, 
          image_url: user.image_url,
          jabatan_id: user.jabatan_id,
          jabatan: jabatan?.nama,
          level: jabatan?.level
        };
      }).sort((a, b) => (a.level || 999) - (b.level || 999));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Gagal memuat data users');
    }
  };

  const loadJabatans = async () => {
    try {
      const { data, error } = await supabase
        .from('jabatan' as any)
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('Error loading jabatans:', error);
        toast.error('Gagal memuat data jabatan');
        return;
      }
      
      setJabatans((data as any[])?.map((j: any) => ({
        id: j.id,
        nama: j.nama,
        level: j.level
      })) || []);
    } catch (error) {
      console.error('Error loading jabatans:', error);
      toast.error('Gagal memuat data jabatan');
    }
  };

  useEffect(() => {
    loadUsers();
    loadJabatans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = {
        nama: formData.nama,
        image_url: formData.image_url || null,
        jabatan_id: formData.jabatan_id ? parseInt(formData.jabatan_id) : null
      };

      if (editingUser) {
        // Update user in database
        const { error } = await supabase
          .from('users' as any)
          .update(userData)
          .eq('id', editingUser.id);

        if (error) {
          console.error('Error updating user:', error);
          toast.error('Gagal memperbarui user');
          return;
        }

        toast.success('User berhasil diperbarui');
        setIsEditDialogOpen(false);
      } else {
        // Insert new user to database
        const { error } = await supabase
          .from('users' as any)
          .insert([userData]);

        if (error) {
          console.error('Error creating user:', error);
          toast.error('Gagal menambahkan user');
          return;
        }

        toast.success('User berhasil ditambahkan');
        setIsAddDialogOpen(false);
      }

      setFormData({ nama: "", image_url: "", jabatan_id: "" });
      setEditingUser(null);
      await loadUsers(); // Reload data from database
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Gagal menyimpan user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      image_url: user.image_url || "",
      jabatan_id: user.jabatan_id?.toString() || ""
    });
    setIsEditDialogOpen(true);
  };

  const deleteImageFromStorage = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (imageUrl.includes('/storage/v1/object/public/uploads/')) {
        await supabase.storage
          .from('uploads')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // Get the user to access its image_url
      const userToDelete = users.find(user => user.id === id);
      
      // Delete user from database
      const { error } = await supabase
        .from('users' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Gagal menghapus user');
        return;
      }

      // Delete associated image if exists
      if (userToDelete?.image_url) {
        await deleteImageFromStorage(userToDelete.image_url);
      }

      toast.success('User berhasil dihapus');
      await loadUsers(); // Reload data from database
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Gagal menghapus user');
    }
  };

  const getLevelBadge = (level?: number) => {
    if (!level) return null;
    
    const variants = {
      1: "default",
      2: "secondary", 
      3: "outline"
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || "outline"}>
        Level {level}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Users</h1>
          <p className="text-muted-foreground">Kelola anggota berdasarkan hierarki jabatan</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Foto Profile"
              />
              <div>
                <Label htmlFor="jabatan">Jabatan</Label>
                <Select value={formData.jabatan_id} onValueChange={(value) => setFormData({ ...formData, jabatan_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jabatans.map((jabatan) => (
                      <SelectItem key={jabatan.id} value={jabatan.id.toString()}>
                        {jabatan.nama} (Level {jabatan.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Daftar Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image_url} alt={user.nama} />
                      <AvatarFallback>
                        {user.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.level === 1 && <Crown className="h-4 w-4 text-accent" />}
                      {user.nama}
                    </div>
                  </TableCell>
                  <TableCell>{user.jabatan || 'Tidak ada jabatan'}</TableCell>
                  <TableCell>{getLevelBadge(user.level)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-nama">Nama</Label>
                              <Input
                                id="edit-nama"
                                value={formData.nama}
                                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                required
                              />
                            </div>
                            <ImageUpload
                              value={formData.image_url}
                              onChange={(url) => setFormData({ ...formData, image_url: url })}
                              label="Foto Profile"
                            />
                            <div>
                              <Label htmlFor="edit-jabatan">Jabatan</Label>
                              <Select value={formData.jabatan_id} onValueChange={(value) => setFormData({ ...formData, jabatan_id: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih jabatan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {jabatans.map((jabatan) => (
                                    <SelectItem key={jabatan.id} value={jabatan.id.toString()}>
                                      {jabatan.nama} (Level {jabatan.level})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1">Update</Button>
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Batal
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus user "{user.nama}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}