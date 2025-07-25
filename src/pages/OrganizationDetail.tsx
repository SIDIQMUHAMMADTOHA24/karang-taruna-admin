import { useState, useEffect } from "react";
import { Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DetailData {
  id: number;
  masa_jabatan: string;
  alamat: string;
  no_telp?: string;
  email?: string;
  yt_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
}

export default function OrganizationDetail() {
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    masa_jabatan: "",
    alamat: "",
    no_telp: "",
    email: "",
    yt_url: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: ""
  });

  const loadDetailData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('detail_data' as any)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading detail data:', error);
        toast.error('Gagal memuat data organisasi');
        return;
      }

      if (data) {
        const detailDataRecord = data as any;
        setDetailData(detailDataRecord);
        setFormData({
          masa_jabatan: detailDataRecord.masa_jabatan || "",
          alamat: detailDataRecord.alamat || "",
          no_telp: detailDataRecord.no_telp || "",
          email: detailDataRecord.email || "",
          yt_url: detailDataRecord.yt_url || "",
          instagram_url: detailDataRecord.instagram_url || "",
          facebook_url: detailDataRecord.facebook_url || "",
          tiktok_url: detailDataRecord.tiktok_url || ""
        });
      }
    } catch (error) {
      console.error('Error loading detail data:', error);
      toast.error('Gagal memuat data organisasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetailData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const updateData = {
        masa_jabatan: formData.masa_jabatan,
        alamat: formData.alamat,
        no_telp: formData.no_telp || null,
        email: formData.email || null,
        yt_url: formData.yt_url || null,
        instagram_url: formData.instagram_url || null,
        facebook_url: formData.facebook_url || null,
        tiktok_url: formData.tiktok_url || null
      };

      if (detailData?.id) {
        // Update existing record
        const { error } = await supabase
          .from('detail_data' as any)
          .update(updateData)
          .eq('id', detailData.id);

        if (error) {
          console.error('Error updating detail data:', error);
          toast.error('Gagal memperbarui data organisasi');
          return;
        }
      } else {
        // Insert new record (upsert)
        const { error } = await supabase
          .from('detail_data' as any)
          .insert([updateData]);

        if (error) {
          console.error('Error inserting detail data:', error);
          toast.error('Gagal menyimpan data organisasi');
          return;
        }
      }

      toast.success('Data organisasi berhasil disimpan');
      await loadDetailData();
    } catch (error) {
      console.error('Error saving detail data:', error);
      toast.error('Gagal menyimpan data organisasi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Detail Data Organisasi</h1>
        <p className="text-muted-foreground">Kelola informasi detail organisasi dan media sosial</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informasi Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="masa_jabatan">Masa Jabatan *</Label>
                <Input
                  id="masa_jabatan"
                  value={formData.masa_jabatan}
                  onChange={(e) => setFormData({ ...formData, masa_jabatan: e.target.value })}
                  placeholder="2024-2029"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="organisasi@email.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alamat">Alamat *</Label>
              <Textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap organisasi"
                required
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="no_telp">Nomor Telepon</Label>
              <Input
                id="no_telp"
                value={formData.no_telp}
                onChange={(e) => setFormData({ ...formData, no_telp: e.target.value })}
                placeholder="+62 xxx-xxxx-xxxx"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Media Sosial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="youtube_url">YouTube URL</Label>
                  <Input
                    id="youtube_url"
                    type="url"
                    value={formData.yt_url}
                    onChange={(e) => setFormData({ ...formData, yt_url: e.target.value })}
                    placeholder="https://youtube.com/@channel"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/page"
                  />
                </div>
                <div>
                  <Label htmlFor="tiktok_url">TikTok URL</Label>
                  <Input
                    id="tiktok_url"
                    type="url"
                    value={formData.tiktok_url}
                    onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan Data Organisasi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}