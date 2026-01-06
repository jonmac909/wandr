'use client';

import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  activeTab?: 'trips' | 'bookings' | 'finance';
  onOpenDrawer?: () => void;
}

const TABS = [
  { id: 'trips', label: 'Trips', href: '/' },
  { id: 'bookings', label: 'Bookings', href: '#' },
  { id: 'finance', label: 'Finance', href: '#' },
] as const;

export function DashboardHeader({ activeTab = 'trips', onOpenDrawer }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Wandr
          </h1>
        </Link>

        {/* Center Tabs - Hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.id
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenDrawer}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>

          {/* Profile avatar */}
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarImage src="" alt="Profile" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              JY
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
