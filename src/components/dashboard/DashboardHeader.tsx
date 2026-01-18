'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plane, Compass, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardHeaderProps {
  activeTab?: 'explore' | 'saved' | 'trips';
  onOpenDrawer?: () => void;
  onOpenProfile?: () => void;
}

export function DashboardHeader({ activeTab, onOpenDrawer, onOpenProfile }: DashboardHeaderProps) {
  const pathname = usePathname();

  // Determine active tab from pathname if not provided
  const currentTab = activeTab || (
    pathname === '/explore' ? 'explore' :
    pathname === '/saved' ? 'saved' :
    'trips'
  );

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex-shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Trippified
          </h1>
        </Link>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1">
          <Link
            href="/explore"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'explore'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Explore</span>
          </Link>
          <Link
            href="/saved"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'saved'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
          </Link>
          <button
            onClick={onOpenDrawer}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'trips'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span className="hidden sm:inline">Trips</span>
          </button>
        </nav>

        {/* Right: Profile */}
        <button onClick={onOpenProfile} className="flex-shrink-0">
          <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              JY
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
