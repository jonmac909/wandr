'use client';

import Link from 'next/link';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PlanNewTripButton() {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Ready for your next adventure?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Let AI help you plan the perfect trip tailored to your preferences.
        </p>
        <Link href="/plan-mode" className="block">
          <Button className="w-full gap-2 shadow-glow">
            <Sparkles className="w-4 h-4" />
            Plan New Trip
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
