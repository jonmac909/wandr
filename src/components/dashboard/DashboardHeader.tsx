'use client';

import Link from 'next/link';
import { Bell, MessageCircle, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardHeaderProps {
  activeTab?: 'trips';
  onOpenDrawer?: () => void;
  onOpenProfile?: () => void;
  onOpenChat?: () => void;
}

export function DashboardHeader({ activeTab = 'trips', onOpenDrawer, onOpenProfile, onOpenChat }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
        {/* Centered Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Trippified
          </h1>
        </Link>

        {/* Left side - Chat button (only active on trip pages) */}
        <div className="flex items-center">
          {onOpenChat ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenChat}
              title="Trip Assistant"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled
              title="Open a trip to chat with AI"
              className="opacity-40"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Explore button - links to explore page */}
          <Link href="/explore">
            <Button
              variant="ghost"
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Explore</span>
            </Button>
          </Link>

          {/* Trips button - opens drawer */}
          <Button
            variant="ghost"
            className="gap-2"
            onClick={onOpenDrawer}
          >
            <Plane className="w-4 h-4" />
            <span className="hidden sm:inline">Trips</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* Profile avatar - opens settings */}
          <button onClick={onOpenProfile} className="ml-1">
            <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                JY
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </header>
  );
}
