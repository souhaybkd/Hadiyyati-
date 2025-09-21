'use client'

import React from 'react'
import { WishlistItem } from "@/lib/actions/wishlist";
import { WishlistItemCard } from "./WishlistItemCard";
import { Heart } from "lucide-react";

type WishlistViewProps = {
  items: WishlistItem[];
  palette: {
    name: string;
    value: string;
    bg: string;
    link: string;
    headerIconBg: string;
    headerIconColor: string;
    buttonPrimary?: string;
    buttonOutline?: string;
  };
  isPublicView?: boolean;
  profile?: any; // Add profile prop to pass to WishlistItemCard
};

export function WishlistView({ items, palette, isPublicView = false, profile }: WishlistViewProps) {
  const publicItems = isPublicView ? items.filter(item => item.is_public) : items;

  return (
    <div>
      <div className="space-y-4">
        {publicItems.map((item) => (
          <WishlistItemCard 
            key={item.id} 
            item={item} 
            profile={profile}
            palette={palette} 
          />
        ))}
      </div>

      {publicItems.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            This wishlist is currently empty.
          </p>
        </div>
      )}
    </div>
  );
} 