'use client';

import { PackingList } from '@/types/itinerary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Shirt, Laptop, Droplets, FileText, X, Cloud, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface PackingListProps {
  packingList: PackingList;
  onToggleItem?: (category: string, itemIndex: number) => void;
  onRegenerate?: () => void;
}

export function PackingListView({ packingList, onToggleItem, onRegenerate }: PackingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const totalItems =
    packingList.capsuleWardrobe.length +
    packingList.activitySpecific.length +
    packingList.electronics.length +
    packingList.toiletries.length +
    packingList.documents.length;

  const packedCount = checkedItems.size;
  const progress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Packing List
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {packingList.bagSizeRationale}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {packingList.bagSize.toUpperCase()}
              </Badge>
              {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Packed</span>
              <span>{packedCount} / {totalItems} items</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Climate Notes */}
      {packingList.climateNotes && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Cloud className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Climate Notes</div>
                <p className="text-sm text-blue-800">{packingList.climateNotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wardrobe */}
      <PackingCategory
        icon={<Shirt className="w-5 h-5" />}
        title="Capsule Wardrobe"
        items={packingList.capsuleWardrobe.map((w) => ({
          item: w.item,
          quantity: w.quantity,
          notes: w.notes,
          essential: true,
        }))}
        checkedItems={checkedItems}
        onToggle={toggleItem}
        categoryPrefix="wardrobe"
      />

      {/* Activity Specific */}
      {packingList.activitySpecific.length > 0 && (
        <PackingCategory
          icon={<Package className="w-5 h-5" />}
          title="Activity Specific"
          items={packingList.activitySpecific}
          checkedItems={checkedItems}
          onToggle={toggleItem}
          categoryPrefix="activity"
        />
      )}

      {/* Electronics */}
      {packingList.electronics.length > 0 && (
        <PackingCategory
          icon={<Laptop className="w-5 h-5" />}
          title="Electronics"
          items={packingList.electronics}
          checkedItems={checkedItems}
          onToggle={toggleItem}
          categoryPrefix="electronics"
        />
      )}

      {/* Toiletries */}
      {packingList.toiletries.length > 0 && (
        <PackingCategory
          icon={<Droplets className="w-5 h-5" />}
          title="Toiletries"
          items={packingList.toiletries}
          checkedItems={checkedItems}
          onToggle={toggleItem}
          categoryPrefix="toiletries"
        />
      )}

      {/* Documents */}
      {packingList.documents.length > 0 && (
        <PackingCategory
          icon={<FileText className="w-5 h-5" />}
          title="Documents"
          items={packingList.documents}
          checkedItems={checkedItems}
          onToggle={toggleItem}
          categoryPrefix="documents"
        />
      )}

      {/* Do NOT Bring */}
      {packingList.doNotBring.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <X className="w-5 h-5" />
              Do NOT Bring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {packingList.doNotBring.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-destructive mt-0.5" />
                  <div>
                    <span className="font-medium">{item.item}</span>
                    <span className="text-muted-foreground"> — {item.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PackingItem {
  item: string;
  quantity: number;
  essential?: boolean;
  notes?: string;
}

function PackingCategory({
  icon,
  title,
  items,
  checkedItems,
  onToggle,
  categoryPrefix,
}: {
  icon: React.ReactNode;
  title: string;
  items: PackingItem[];
  checkedItems: Set<string>;
  onToggle: (key: string) => void;
  categoryPrefix: string;
}) {
  const categoryChecked = items.filter((_, i) =>
    checkedItems.has(`${categoryPrefix}-${i}`)
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {categoryChecked}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => {
            const key = `${categoryPrefix}-${i}`;
            const isChecked = checkedItems.has(key);
            const itemName = item.item;

            return (
              <li
                key={i}
                className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded"
                onClick={() => onToggle(key)}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggle(key)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className={isChecked ? 'line-through text-muted-foreground' : ''}>
                    {itemName}
                    {item.quantity > 1 && (
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    )}
                  </span>
                  {item.essential && (
                    <Badge variant="outline" className="ml-2 text-xs">Essential</Badge>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
