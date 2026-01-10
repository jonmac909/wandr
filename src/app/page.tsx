'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Upload, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DashboardHeader,
  TripDrawer,
  ImportModal,
  ProfileSettings,
  DestinationInspiration,
} from '@/components/dashboard';
import { GeneralChatSheet } from '@/components/chat/GeneralChatSheet';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Home() {
  const { trips, loading, refresh } = useDashboardData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Where to next?</h1>
          <p className="text-muted-foreground">Plan your next adventure</p>
        </div>

        {/* CTAs */}
        <div className="space-y-3 mb-8">
          <Link href="/plan" className="block">
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Plan New Trip</h3>
                  <p className="text-sm text-muted-foreground">AI-powered itinerary planning</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <button onClick={() => setImportModalOpen(true)} className="w-full text-left">
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Import Trip</h3>
                  <p className="text-sm text-muted-foreground">Upload or paste existing itinerary</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">Inspiration</span>
          </div>
        </div>

        {/* Destination Inspiration */}
        <DestinationInspiration trips={trips} />
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={refresh}
      />

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <GeneralChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
