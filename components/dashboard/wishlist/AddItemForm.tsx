'use client'

import { useState, useEffect, useRef } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, ExternalLink, DollarSign, Loader2, Info, Upload, X, AlertCircle } from "lucide-react";
import { 
  addWishlistItem, 
  updateWishlistItem, 
  type WishlistItem 
} from "@/lib/actions/wishlist";
import { getPlatformFeePercentage, calculateExpectedPayout } from "@/lib/actions/platform-settings";
import { uploadProductImage, validateImageFile } from "@/lib/storage";
import { createSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface AddItemFormProps {
  item?: WishlistItem;
  onItemAdded?: () => void;
  onClose?: () => void;
}

export function AddItemForm({ item, onItemAdded, onClose }: AddItemFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    product_url: '',
    image_url: '',
    price: '',
    description: '',
    is_public: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformFeePercentage, setPlatformFeePercentage] = useState<number>(10);
  const [expectedPayout, setExpectedPayout] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize form with item data if editing
  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        product_url: item.product_url || '',
        image_url: item.image_url || '',
        price: (item.price ?? 0).toString(),
        description: item.description || '',
        is_public: item.is_public
      });
      // Set uploaded image preview if editing
      if (item.image_url) {
        setUploadedImage(item.image_url);
      }
    }
  }, [item]);

  // Load platform fee percentage on component mount
  useEffect(() => {
    const loadPlatformFee = async () => {
      try {
        const feePercentage = await getPlatformFeePercentage();
        setPlatformFeePercentage(feePercentage);
      } catch (error) {
        console.error('Error loading platform fee:', error);
        // Keep default 10%
      }
    };
    
    loadPlatformFee();
  }, []);

  // Calculate expected payout when price changes
  useEffect(() => {
    const price = parseFloat(formData.price);
    if (!isNaN(price) && price > 0) {
      const payout = price * (1 - (platformFeePercentage / 100));
      setExpectedPayout(payout);
    } else {
      setExpectedPayout(0);
    }
  }, [formData.price, platformFeePercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('product_url', formData.product_url);
      formDataObj.append('image_url', formData.image_url);
      formDataObj.append('price', formData.price);
      formDataObj.append('description', formData.description);
      formDataObj.append('is_public', formData.is_public.toString());

      if (item) {
        // Update existing item
        await updateWishlistItem(item.id, formDataObj);
      } else {
        // Add new item
        await addWishlistItem(formDataObj);
      }

      // Reset form if adding new item
      if (!item) {
        setFormData({
          title: '',
          product_url: '',
          image_url: '',
          price: '',
          description: '',
          is_public: true
        });
      }

      onItemAdded?.();
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUploadError('Please log in to upload images')
        setIsUploading(false)
        return
      }

      const result = await uploadProductImage(file, user.id)

      if (result.success && result.publicUrl) {
        setUploadedImage(result.publicUrl)
        setFormData(prev => ({ ...prev, image_url: result.publicUrl || '' }))
        setUploadError(null)
      } else {
        setUploadError(result.error || 'Upload failed. Please try again.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto px-2">
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        {/* Preview Card */}
        {(formData.title || formData.image_url) && (
          <Card className="bg-muted/50">
            <CardContent className="p-0">
              <div className="flex gap-3">
                {formData.image_url ? (
                  <img 
                    src={formData.image_url} 
                    alt={formData.title || "Preview"} 
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {formData.title || "Item title will appear here"}
                  </h4>
                  {formData.price && (
                    <p className="text-sm font-medium text-purple-600">${formData.price}</p>
                  )}
                  {formData.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{formData.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Item Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Sony WH-1000XM5 Headphones"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="299.99"
                className="pl-10"
                required
              />
            </div>
            {expectedPayout > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-green-800 font-medium">
                      You will receive: <span className="text-lg font-bold">${expectedPayout.toFixed(2)}</span>
                    </p>
                    <p className="text-green-700 text-xs mt-1">
                      After {platformFeePercentage}% platform fee (${(parseFloat(formData.price || '0') * (platformFeePercentage / 100)).toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_url">Product Link (Optional)</Label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="product_url"
                type="url"
                value={formData.product_url}
                onChange={(e) => handleChange('product_url', e.target.value)}
                placeholder="https://amazon.com/..."
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_upload">Product Image (Optional)</Label>
            
            {/* Image Preview */}
            {uploadedImage && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={uploadedImage} 
                  alt="Product preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                  onClick={clearImage}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload Area */}
            {!uploadedImage && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading image...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">Drop your image here</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      or click to browse your files
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG, GIF, WebP - Max 5MB
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />

            {uploadError && (
              <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Any specific details, preferences, or additional information..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => handleChange('is_public', checked)}
            />
            <Label htmlFor="is_public">Make this item public</Label>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {item ? 'Update Item' : 'Add to Wishlist'}
          </Button>
          {!item && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setFormData({
                title: '',
                product_url: '',
                image_url: '',
                price: '',
                description: '',
                is_public: true
              })}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 