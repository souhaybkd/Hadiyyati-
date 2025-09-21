'use client'

import React from 'react'

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'stats' | 'hero' | 'table' | 'form'
  count?: number
}

const SkeletonElement = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}></div>
)

export function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'hero') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800 p-4">
        <div className="w-full max-w-md text-center">
          <SkeletonElement className="h-8 w-32 mx-auto mb-4" />
          <SkeletonElement className="h-16 w-full mb-6" />
          <SkeletonElement className="h-6 w-3/4 mx-auto mb-8" />
          <div className="flex gap-4 justify-center">
            <SkeletonElement className="h-12 w-32" />
            <SkeletonElement className="h-12 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center mb-2">
              <SkeletonElement className="w-8 h-8 rounded-full mr-2" />
              <SkeletonElement className="h-4 w-20" />
            </div>
            <SkeletonElement className="h-8 w-16 mb-2" />
            <SkeletonElement className="h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="overflow-x-auto p-4">
        <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {Array.from({ length: 5 }).map((_, index) => (
                  <th key={index} className="p-4 text-left">
                    <SkeletonElement className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <td key={colIndex} className="p-4">
                      <SkeletonElement className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <SkeletonElement className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonElement className="h-4 w-3/4" />
              <SkeletonElement className="h-3 w-1/2" />
            </div>
            <SkeletonElement className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }
  
  if (type === 'form') {
    return <FormSkeleton />
  }

  // Default: card type
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SkeletonElement className="w-full h-32" />
          <div className="p-4 space-y-3">
            <SkeletonElement className="h-6 w-3/4" />
            <SkeletonElement className="h-4 w-full" />
            <SkeletonElement className="h-4 w-2/3" />
            <div className="flex justify-between items-center pt-2">
              <SkeletonElement className="h-8 w-16" />
              <SkeletonElement className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Specialized skeleton components
export function NavbarSkeleton() {
  return (
    <div className="w-full h-16 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
      <SkeletonElement className="h-8 w-24" />
      <div className="hidden lg:flex gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonElement key={index} className="h-6 w-16" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <SkeletonElement className="w-8 h-8 rounded-full" />
        <SkeletonElement className="w-8 h-8 rounded-full" />
        <SkeletonElement className="h-8 w-16" />
      </div>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="p-8 border border-gray-200 dark:border-gray-700 rounded-lg max-w-lg mx-auto">
      <div className="text-center mb-8">
        <SkeletonElement className="w-16 h-16 rounded-full mx-auto mb-4" />
        <SkeletonElement className="h-8 w-48 mx-auto mb-2" />
        <SkeletonElement className="h-4 w-64 mx-auto" />
      </div>
      
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <SkeletonElement className="h-4 w-20 mb-2" />
            <SkeletonElement className="h-12 w-full" />
          </div>
        ))}
        <SkeletonElement className="h-12 w-full mt-8" />
      </div>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
      </div>
      
      <SkeletonElement className="h-12 w-full" />
    </div>
  )
} 