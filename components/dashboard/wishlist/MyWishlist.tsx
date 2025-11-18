'use client'

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Copy, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  Gift,
  Heart,
  Save,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  GripVertical,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddItemForm } from "./AddItemForm";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { 
  getUserWishlistItems, 
  getUserProfile, 
  updateProfile,
  updateWishlistOrder,
  deleteWishlistItem,
  toggleItemPurchased,
  toggleItemPublic,
  type WishlistItem,
  type Profile
} from "@/lib/actions/wishlist";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided } from '@hello-pangea/dnd';
import { ProfileImage } from "@/components/shared/ProfileImage";
import { ProfileImageEditorCompact } from "./ProfileImageEditorCompact";
import { BackgroundImageEditor } from "./BackgroundImageEditor";

const colorPalettes = [
    { 
        name: 'Default', 
        value: 'default', 
        bg: 'bg-gradient-to-br from-sky-50 to-blue-100', 
        link: 'text-blue-600', 
        headerIconBg: 'bg-gradient-to-br from-sky-500 to-blue-500', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonOutline: 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
    },
    { 
        name: 'Sunrise', 
        value: 'sunrise', 
        bg: 'bg-gradient-to-br from-amber-50 to-orange-100', 
        link: 'text-orange-600', 
        headerIconBg: 'bg-gradient-to-br from-amber-500 to-orange-500', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
        buttonOutline: 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white'
    },
    { 
        name: 'Forest', 
        value: 'forest', 
        bg: 'bg-gradient-to-br from-emerald-50 to-green-100', 
        link: 'text-green-700', 
        headerIconBg: 'bg-gradient-to-br from-emerald-600 to-green-600', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
        buttonOutline: 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
    },
    { 
        name: 'Ocean', 
        value: 'ocean', 
        bg: 'bg-gradient-to-br from-cyan-50 to-indigo-100', 
        link: 'text-indigo-600', 
        headerIconBg: 'bg-gradient-to-br from-cyan-500 to-indigo-500', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        buttonOutline: 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
    },
    { 
        name: 'Lavender', 
        value: 'lavender', 
        bg: 'bg-gradient-to-br from-violet-50 to-fuchsia-100', 
        link: 'text-violet-600', 
        headerIconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-500', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
        buttonOutline: 'border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white'
    },
    { 
        name: 'Rose', 
        value: 'rose', 
        bg: 'bg-gradient-to-br from-rose-50 to-pink-100', 
        link: 'text-rose-600', 
        headerIconBg: 'bg-gradient-to-br from-rose-500 to-pink-500', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-rose-600 hover:bg-rose-700 text-white',
        buttonOutline: 'border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white'
    },
    { 
        name: 'Midnight', 
        value: 'midnight', 
        bg: 'bg-gradient-to-br from-slate-50 to-gray-100', 
        link: 'text-slate-700', 
        headerIconBg: 'bg-gradient-to-br from-slate-600 to-gray-600', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-slate-600 hover:bg-slate-700 text-white',
        buttonOutline: 'border-slate-600 text-slate-600 hover:bg-slate-600 hover:text-white'
    },
    { 
        name: 'Mint', 
        value: 'mint', 
        bg: 'bg-gradient-to-br from-teal-50 to-emerald-100', 
        link: 'text-teal-700', 
        headerIconBg: 'bg-gradient-to-br from-teal-600 to-emerald-600', 
        headerIconColor: 'text-white',
        buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
        buttonOutline: 'border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white'
    },
];

const WishlistItemEditor = ({ 
  item, 
  onEdit, 
  onDelete,
  onTogglePublic,
  onTogglePurchased,
  provided
}: { 
  item: WishlistItem, 
  onEdit: (item: WishlistItem) => void,
  onDelete: (id: string) => void,
  onTogglePublic: (id: string, is_public: boolean) => void,
  onTogglePurchased: (id: string, is_purchased: boolean) => void,
  provided: DraggableProvided
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [isTogglingPurchased, setIsTogglingPurchased] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWishlistItem(item.id);
      onDelete(item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);
    try {
      await toggleItemPublic(item.id, !item.is_public);
      onTogglePublic(item.id, !item.is_public);
    } catch (error) {
      console.error('Error toggling public status:', error);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleTogglePurchased = async () => {
    setIsTogglingPurchased(true);
    try {
      await toggleItemPurchased(item.id, !item.is_purchased);
      onTogglePurchased(item.id, !item.is_purchased);
    } catch (error) {
      console.error('Error toggling purchased status:', error);
    } finally {
      setIsTogglingPurchased(false);
    }
  };

  return (
    <Card 
        ref={provided.innerRef}
        {...provided.draggableProps}
        className="group  transition-shadow border border-design-primary-light  hover:border-design-primary"
    >
      <CardContent className=" ">
        <div className="flex items-center gap-3">
          <div {...provided.dragHandleProps} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-16 h-16 object-cover rounded-lg border"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm truncate">{item.title}</h4>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={handleTogglePurchased}
                  disabled={isTogglingPurchased}
                  title={item.is_purchased ? "Mark as not purchased" : "Mark as purchased"}
                >
                  {isTogglingPurchased ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : item.is_purchased ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Gift className="h-3 w-3" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={handleTogglePublic}
                  disabled={isTogglingPublic}
                  title={item.is_public ? "Make private" : "Make public"}
                >
                  {isTogglingPublic ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : item.is_public ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => onEdit(item)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{item.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {item.price > 0 && (
              <p className="text-xs text-muted-foreground font-medium">${item.price}</p>
            )}
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {item.is_purchased && (
                <Badge variant="secondary" className="text-xs">
                  <Gift className="h-3 w-3 mr-1" />
                  Purchased
                </Badge>
              )}
              {item.is_public && (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WishlistPreview = ({ 
  profile, 
  items,
  palette,
  backgroundImageUrl
}: { 
  profile: Profile | null, 
  items: WishlistItem[],
  palette: typeof colorPalettes[0],
  backgroundImageUrl?: string | null
}) => {

  const publicItems = (items || []).filter(item => item.is_public);

  // Determine which background to use: temporary upload or saved profile background
  const currentBackgroundUrl = backgroundImageUrl || profile?.background_image_url;

  const backgroundStyle = currentBackgroundUrl 
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9)), url(${currentBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div 
      className={cn(
        "h-full p-4 overflow-y-auto pt-16", 
        !currentBackgroundUrl && palette.bg
      )}
      style={backgroundStyle}
    >
      <div className="w-full">
        {/* Preview Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mx-auto mb-4 ">
            <ProfileImage 
              avatarUrl={profile?.avatar_url}
              size="lg"
              palette={palette}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile?.full_name ? `${profile.full_name}'s Wishlist` : 'My Wishlist'}
          </h1>
          <p className="text-gray-600 text-sm">{profile?.wishlist_description || 'Welcome to my wishlist! 🎁'}</p>
        </div>

        {/* Preview Items */}
        <WishlistView items={publicItems} palette={palette} profile={profile} />
      </div>
    </div>
  );
};

export function MyWishlist() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    wishlist_color_palette: 'default',
    wishlist_description: ''
  });
  const [isCopied, setIsCopied] = useState(false);
  
  const [avatarData, setAvatarData] = useState<{ type: 'icon' | 'upload', value: string } | null>(null);
  const [backgroundData, setBackgroundData] = useState<{ type: 'upload' | 'remove', value: string } | null>(null);

  useEffect(() => {
    // Since middleware protects this page, we can directly fetch the data.
    loadData();
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        wishlist_color_palette: profile.wishlist_color_palette || 'default',
        wishlist_description: profile.wishlist_description || ''
      });
    }
  }, [profile]);

  // Refresh data function
  const refreshData = useCallback(async (showRefreshingState = true) => {
    if (showRefreshingState) setRefreshing(true);
    try {
      const [profileData, itemsData] = await Promise.all([
        getUserProfile(),
        getUserWishlistItems()
      ]);
      setProfile(profileData);
      setItems(itemsData);
      console.log('Wishlist refreshed:', itemsData.length, 'items');
    } catch (error) {
      console.error('Error refreshing wishlist data:', error);
    } finally {
      if (showRefreshingState) setRefreshing(false);
    }
  }, []);

  const loadData = async () => {
    // Reset state for re-fetching
    setDataLoading(true);
    setError(null);
    try {
      const [profileData, itemsData] = await Promise.all([
        getUserProfile(),
        getUserWishlistItems()
      ]);
      
      if (!profileData) {
        // This can happen if the handle_new_user trigger in Supabase fails or is missing.
        setError("Your user profile could not be loaded. This might be a setup issue.");
      } else {
        setProfile(profileData);
        setItems(itemsData);
      }
    } catch (err) {
      console.error('Error loading wishlist data:', err);
      setError('An unexpected error occurred while loading your wishlist.');
    } finally {
      setDataLoading(false);
    }
  };

  // Set up automatic refresh every 45 seconds for wishlist
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData(false); // Refresh without showing loading state
    }, 45000); // 45 seconds

    return () => clearInterval(interval);
  }, [refreshData]);

  // Listen for storage events (when user navigates back from payment success)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment_completed') {
        console.log('Payment completion detected, refreshing wishlist');
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  // Listen for focus events (when user comes back to the tab)
  useEffect(() => {
    const handleFocus = () => {
      refreshData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
  };

  const handleDelete = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleTogglePublic = (itemId: string, is_public: boolean) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, is_public } : item));
  };

  const handleTogglePurchased = (itemId: string, is_purchased: boolean) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, is_purchased } : item));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const formData = new FormData();
      formData.append('username', profileForm.username);
      formData.append('full_name', profileForm.full_name);
      formData.append('wishlist_color_palette', profileForm.wishlist_color_palette);
      formData.append('wishlist_description', profileForm.wishlist_description);
      
      // Handle avatar update
      if (avatarData) {
        if (avatarData.type === 'icon') {
          formData.append('avatar_url', `icon:${avatarData.value}`);
        } else if (avatarData.type === 'upload') {
          formData.append('avatar_url', avatarData.value);
        }
      }
      
      // Handle background image update
      if (backgroundData) {
        if (backgroundData.type === 'upload') {
          formData.append('background_image_url', backgroundData.value);
        } else if (backgroundData.type === 'remove') {
          formData.append('background_image_url', ''); // Empty string to remove
        }
      }
      
      await updateProfile(formData);
      
      // Manually update the profile state to avoid a full data reload
      setProfile(prev => prev ? { 
        ...prev, 
        ...profileForm,
        avatar_url: avatarData ? (avatarData.type === 'icon' ? `icon:${avatarData.value}` : avatarData.value) : prev.avatar_url,
        background_image_url: backgroundData ? (backgroundData.type === 'upload' ? backgroundData.value : null) : prev.background_image_url
      } : null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleItemAdded = () => {
    refreshData(); // Reload data when new item is added
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePaletteChange = (palette: string) => {
    setProfileForm(prev => ({ ...prev, wishlist_color_palette: palette }));
  };
  
  const handleAvatarChange = (imageData: { type: 'icon' | 'upload', value: string }) => {
    setAvatarData(imageData);
  };

  const handleBackgroundChange = (imageData: { type: 'upload' | 'remove', value: string }) => {
    setBackgroundData(imageData);
  };

  // Get the current background URL for preview (temporary state takes precedence)
  const getCurrentBackgroundUrl = () => {
    if (backgroundData?.type === 'upload') {
      return backgroundData.value;
    } else if (backgroundData?.type === 'remove') {
      return null;
    }
    return profile?.background_image_url || null;
  };

  const handleOnDragEnd = async (result: DropResult) => {
    if (!result.destination || !items) return;

    const reorderedItems = Array.from(items);
    const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, reorderedItem);

    setItems(reorderedItems);

    const itemsToUpdate = reorderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    try {
      await updateWishlistOrder(itemsToUpdate);
    } catch (error) {
      console.error('Failed to update wishlist order:', error);
      // Optionally, revert the state change on error
      loadData();
    }
  };

  const handleCopyLink = () => {
    if (isCopied) return;

    const shareableLink = profile?.username 
      ? `${window.location.origin}/wishlist/${profile.username}`
      : '';
      
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };


  // Show a loading indicator while data is being fetched.
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-design-primary" />
          <p className="text-design-text-muted">Loading your wishlist...</p>
        </div>
      </div>
    );
  }
  




  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 animate-spin text-red-500" />
          <p className="text-design-text-error font-semibold">{error}</p>
          <Button onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  const selectedPalette = colorPalettes.find(p => p.value === profileForm.wishlist_color_palette) || colorPalettes[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Left side: Editor */}
      <div className="flex flex-col space-y-8 overflow-y-auto p-4 col-span-2">
        {/* Items Management */}
        <Card >
          <CardHeader>
            <div className="flex justify-between flex-col lg:flex-row items-center gap-4 lg:gap-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-design-h3 text-design-text-heading">
                  <Gift className="h-5 w-5 text-design-primary" />
                  Wishlist Items ({items?.length || 0})
                </CardTitle>
                <CardDescription className="text-design-text-muted">
                  Add, edit, or remove items from your wishlist.
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshData()}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Sheet open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <SheetTrigger asChild>
                    <Button onClick={() => setIsAddItemOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle className="text-design-h3 text-design-text-heading">Add New Item</SheetTitle>
                      <SheetDescription className="text-design-text-muted">
                        Fill in the details of the item you want to add to your wishlist.
                      </SheetDescription>
                    </SheetHeader>
                    <AddItemForm 
                      onItemAdded={handleItemAdded} 
                      onClose={() => setIsAddItemOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="wishlist-items">
                    {(provided) => (
                        <div 
                            className="space-y-4"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {(items || []).map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                        <WishlistItemEditor
                                            item={item}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onTogglePublic={handleTogglePublic}
                                            onTogglePurchased={handleTogglePurchased}
                                            provided={provided}
                                        />
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            {(items?.length || 0) === 0 && (
                <div className="text-center py-12 text-design-text-muted">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50 text-design-text-muted" />
                    <p className="text-design-body">No items yet. Add your first item!</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        {/* Settings */}
        <Card >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-design-h3 text-design-text-heading">
              <Settings className="h-5 w-5 text-design-primary" />
              Settings
            </CardTitle>
            <CardDescription className="text-design-text-muted">
              Customize your public wishlist page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Profile Image Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-design-body font-semibold text-design-text-heading">Profile Image</Label>
                <p className="text-design-small text-design-text-muted mt-2">
                  This will be displayed on your public wishlist page
                </p>
              </div>
              <ProfileImageEditorCompact 
                currentAvatar={profile?.avatar_url || null}
                onImageChange={handleAvatarChange}
                isLoading={isSavingProfile}
              />
            </div>
            
            <Separator />

            {/* Background Image Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-design-body font-semibold text-design-text-heading">Background Image</Label>
                <p className="text-design-small text-design-text-muted mt-2">
                  This will be displayed as the background of your public wishlist page
                </p>
              </div>
              <BackgroundImageEditor 
                currentBackground={profile?.background_image_url || null}
                onImageChange={handleBackgroundChange}
                isLoading={isSavingProfile}
              />
            </div>
            
            <Separator />
           
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-design-text-heading">Full Name</Label>
                    <Input
                        id="full_name"
                        name="full_name"
                        value={profileForm.full_name}
                        onChange={handleProfileChange}
                        placeholder="Your full name"
                        className="h-12"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username" className="text-design-text-heading">Username</Label>
                    <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-design-button border border-r-0 border-design-gray-300 bg-design-gray-100 text-design-text-muted text-design-body">
                        /wishlist/
                        </span>
                        <Input
                        id="username"
                        name="username"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        className="rounded-l-none h-12"
                        placeholder="your-username"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="wishlist_description" className="text-design-text-heading">Wishlist Description</Label>
                    <Textarea
                        id="wishlist_description"
                        name="wishlist_description"
                        value={profileForm.wishlist_description}
                        onChange={handleProfileChange}
                        placeholder="A short message for your visitors..."
                        rows={3}
                        className="min-h-[100px]"
                    />
                </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
                <Label className="text-design-text-heading font-semibold">Color Palette</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                    {colorPalettes.map((palette) => (
                        <div key={palette.value} onClick={() => handlePaletteChange(palette.value)} className="cursor-pointer text-center transition-design group">
                            <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-design-card flex items-center justify-center border-4 transition-design mx-auto",
                                profileForm.wishlist_color_palette === palette.value ? "border-design-primary shadow-design-light" : "border-transparent hover:border-design-gray-300 group-hover:border-design-gray-300"
                            )}>
                                <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-design-button", palette.bg)}></div>
                            </div>
                            <p className="text-xs sm:text-design-small mt-2 text-design-text-muted truncate">{palette.name}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Button onClick={handleSaveProfile} className="w-full" disabled={isSavingProfile}>
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSavingProfile ? 'Saving...' : 'Save Settings'}
            </Button>
            {profileError && (
              <p className="text-design-small text-red-600 mt-2">{profileError}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right side: Preview */}
      <div className="hidden lg:block col-span-1">
        <div className="sticky top-8">
          <div className="flex flex-col items-center justify-start gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink} 
              className={cn(
                "text-xs w-[180px] transition-all", 
                isCopied && "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              )}
              disabled={isCopied}
            >
              {isCopied ? (
                <span className="flex items-center justify-center">
                  <Check className="h-3 w-3 mr-1" />
                  Link Copied!
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Sharable Link
                </span>
              )}
            </Button>
            <div className="relative border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[730px] w-[360px] shadow-xl">
              <div className="w-40 h-6 bg-gray-800 top-0 rounded-b-2xl left-1/2 -translate-x-1/2 absolute"></div>
              <div className="h-10 w-1 bg-gray-800 absolute -left-2 top-28 rounded-l-lg"></div>
              <div className="h-12 w-1 bg-gray-800 absolute -left-2 top-44 rounded-l-lg"></div>
              <div className="h-16 w-1 bg-gray-800 absolute -right-2 top-36 rounded-r-lg"></div>
              
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                <WishlistPreview 
                  profile={profile ? {...profile, ...profileForm} : null} 
                  items={items} 
                  palette={selectedPalette}
                  backgroundImageUrl={getCurrentBackgroundUrl()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Item Sheet */}
      {editingItem && (
        <Sheet open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Item</SheetTitle>
              <SheetDescription>
                Update the details of your wishlist item.
              </SheetDescription>
            </SheetHeader>
            <AddItemForm 
              item={editingItem} 
              onItemAdded={() => {
                setEditingItem(null);
                handleItemAdded();
              }}
              onClose={() => setEditingItem(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
} 