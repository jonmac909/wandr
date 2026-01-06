'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  trend?: number; // percentage change
  suffix?: string;
  className?: string;
}

export function StatCard({ label, value, trend, suffix, className }: StatCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {suffix && <span className="text-lg text-muted-foreground mb-1">{suffix}</span>}
          {trend !== undefined && trend !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium mb-1",
                isPositive && "text-green-600",
                isNegative && "text-red-600"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive && '+'}
              {trend}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
