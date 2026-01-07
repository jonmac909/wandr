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
    <Card className={cn("py-0", className)}>
      <CardContent className="p-2">
        <p className="text-[10px] text-muted-foreground mb-0.5 truncate">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold">{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
          {trend !== undefined && trend !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px] font-medium",
                isPositive && "text-green-600",
                isNegative && "text-red-600"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
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
