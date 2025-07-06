"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle, Upload, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProgressMigrationStatus() {
  const { isSignedIn, userId } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'complete' | 'error'>('idle');
  const [migrationDetails, setMigrationDetails] = useState<{
    migratedExercises: number;
    migratedRecords: number;
  } | null>(null);

  useEffect(() => {
    if (isSignedIn && userId && migrationStatus === 'idle') {
      const performMigration = async () => {
        setMigrationStatus('migrating');
        
        try {
          // Check if there's local progress to migrate
          const localProgress = localStorage.getItem('vjezbajmo-completed-exercises');
          if (!localProgress) {
            setMigrationStatus('complete');
            return;
          }

          const response = await fetch('/api/user/progress/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              localProgress: JSON.parse(localProgress),
              userId 
            }),
          });

          if (response.ok) {
            const result = await response.json();
            setMigrationDetails({
              migratedExercises: result.migratedExercises || 0,
              migratedRecords: result.migratedRecords || 0,
            });
            setMigrationStatus('complete');
          } else {
            setMigrationStatus('error');
          }
        } catch (error) {
          console.error('Migration failed:', error);
          setMigrationStatus('error');
        }
      };

      performMigration();
    }
  }, [isSignedIn, userId, migrationStatus]);

  if (!isSignedIn || migrationStatus === 'idle') {
    return null;
  }

  if (migrationStatus === 'migrating') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>
          Syncing your progress to your account...
        </AlertDescription>
      </Alert>
    );
  }

  if (migrationStatus === 'complete' && migrationDetails) {
    const { migratedExercises, migratedRecords } = migrationDetails;
    
    if (migratedExercises > 0 || migratedRecords > 0) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully synced {migratedExercises} completed exercises and {migratedRecords} progress records to your account!
          </AlertDescription>
        </Alert>
      );
    }
  }

  if (migrationStatus === 'error') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Upload className="h-4 w-4" />
        <AlertDescription>
          Failed to sync local progress. Don&apos;t worry - your local progress is still saved.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
