import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Activity {
  id: number;
  title: string;
  description: string;
  category_id?: number;
  date?: string;
  location?: string;
  people?: string;
  image_url?: string;
  created_at: string;
}

interface Category {
  id: number;
  title: string;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    date: '',
    location: '',
    people: '',
    image_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesResult, categoriesResult] = await Promise.all([
        supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, title')
          .order('title')
      ]);

      if (activitiesResult.error) throw activitiesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setActivities(activitiesResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        date: formData.date || null,
      };

      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update(submitData)
          .eq('id', editingActivity.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Activity updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('activities')
          .insert([submitData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Activity created successfully",
        });
      }

      setDialogOpen(false);
      setEditingActivity(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      category_id: activity.category_id?.toString() || '',
      date: activity.date || '',
      location: activity.location || '',
      people: activity.people || '',
      image_url: activity.image_url || '',
    });
    setDialogOpen(true);
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
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      // Get the activity to access its image_url
      const activityToDelete = activities.find(act => act.id === id);
      
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Delete associated image if exists
      if (activityToDelete?.image_url) {
        await deleteImageFromStorage(activityToDelete.image_url);
      }
      
      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      date: '',
      location: '',
      people: '',
      image_url: '',
    });
    setEditingActivity(null);
  };

  const getCategoryName = (categoryId?: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.title || 'Uncategorized';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-2">
            Manage community activities and events
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="admin" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? 'Edit Activity' : 'Add New Activity'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Activity title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Activity description"
                  required
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Activity location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="people">People Involved</Label>
                <Input
                  id="people"
                  value={formData.people}
                  onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                  placeholder="Names or roles of people involved"
                />
              </div>

              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                label="Activity Image (optional)"
              />
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="admin" className="flex-1">
                  {editingActivity ? 'Update' : 'Create'} Activity
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{activity.title}</CardTitle>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {activity.date ? new Date(activity.date).toLocaleDateString() : 'No date set'}
                    </span>
                    {activity.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {activity.location}
                      </span>
                    )}
                    {activity.people && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {activity.people}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(activity)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(activity.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-foreground mb-3">{activity.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {getCategoryName(activity.category_id)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {activity.image_url && (
                  <div className="w-full h-32 bg-muted rounded-md overflow-hidden">
                    <img 
                      src={activity.image_url} 
                      alt={activity.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating your first activity to engage your community.
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="admin" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Activity
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default Activities;