"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExerciseLoadingSkeleton() {
  return (
    <>
      {/* Fixed progress bar skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Skeleton className="w-full h-1 rounded-none" />
      </div>

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pt-4 px-3 sm:px-4 lg:px-6">
        <Card className="mx-0 sm:mx-auto shadow-lg sm:shadow-xl border-0 sm:border">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-8 w-64 sm:h-10 sm:w-80" />
              <Skeleton className="h-10 w-20 sm:h-12 sm:w-24" />
            </div>
            <Skeleton className="h-4 w-full mt-2 sm:h-5 sm:w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* Exercise content skeleton */}
            <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 rounded-lg space-y-4">
              {/* Paragraph with input placeholders */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>

            {/* Button skeleton */}
            <div className="text-center">
              <Skeleton className="h-12 w-48 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
