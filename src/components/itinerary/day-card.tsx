'use client';

import { useState } from 'react';
import { DayPlan, TimeBlock, Activity, ActivityPriority, TimeBlockType } from '@/types/itinerary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sun, Coffee, Moon, Bed, Plane, Hotel, Utensils, Compass, Camera,
  MapPin, Clock, Star, Sparkles, AlertCircle, ShoppingBag, Music, Wrench, Bus,
  Pencil, Trash2, Check, X, ExternalLink, DollarSign, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceDetailsModal } from '@/components/maps/place-details-modal';
import { generateBookingUrl, getBookingProvider } from '@/lib/booking/urls';

interface DayCardProps {
  day: DayPlan;
  isToday?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onUpdateDay?: (updatedDay: DayPlan) => void;
  onDeleteActivity?: (blockId: string) => void;
  location?: string;
  // Drag and drop
  onDragStart?: (blockId: string, dayId: string) => void;
  onDragEnd?: () => void;
  onDrop?: (targetDayId: string, targetIndex: number) => void;
  isDragging?: boolean;
  dragOverIndex?: number | null;
  onDragOver?: (dayId: string, index: number) => void;
}

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  'morning-anchor': <Sun className="w-4 h-4" />,
  'midday-flex': <Coffee className="w-4 h-4" />,
  'evening-vibe': <Moon className="w-4 h-4" />,
  'rest-block': <Bed className="w-4 h-4" />,
  'transit': <Plane className="w-4 h-4" />,
};

const BLOCK_COLORS: Record<string, string> = {
  'morning-anchor': 'bg-amber-100 text-amber-800 border-amber-200',
  'midday-flex': 'bg-blue-100 text-blue-800 border-blue-200',
  'evening-vibe': 'bg-purple-100 text-purple-800 border-purple-200',
  'rest-block': 'bg-green-100 text-green-800 border-green-200',
  'transit': 'bg-gray-100 text-gray-800 border-gray-200',
};

// Category-based colors matching the pipeline
const CATEGORY_COLORS: Record<string, string> = {
  'flight': 'bg-blue-100 text-blue-800 border-blue-200',
  'hotel': 'bg-purple-100 text-purple-800 border-purple-200',
  'accommodation': 'bg-purple-100 text-purple-800 border-purple-200',
  'checkin': 'bg-purple-100 text-purple-800 border-purple-200',
  'food': 'bg-orange-100 text-orange-800 border-orange-200',
  'restaurant': 'bg-orange-100 text-orange-800 border-orange-200',
  'activity': 'bg-amber-100 text-amber-800 border-amber-200',
  'experience': 'bg-amber-100 text-amber-800 border-amber-200',
  'sightseeing': 'bg-amber-100 text-amber-800 border-amber-200',
  'relaxation': 'bg-green-100 text-green-800 border-green-200',
  'shopping': 'bg-pink-100 text-pink-800 border-pink-200',
  'nightlife': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'workshop': 'bg-teal-100 text-teal-800 border-teal-200',
  'transit': 'bg-gray-100 text-gray-800 border-gray-200',
};

// Category icons for compact display
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'flight': <Plane className="w-3.5 h-3.5" />,
  'hotel': <Hotel className="w-3.5 h-3.5" />,
  'accommodation': <Hotel className="w-3.5 h-3.5" />,
  'checkin': <Hotel className="w-3.5 h-3.5" />,
  'food': <Utensils className="w-3.5 h-3.5" />,
  'restaurant': <Utensils className="w-3.5 h-3.5" />,
  'activity': <Compass className="w-3.5 h-3.5" />,
  'experience': <Compass className="w-3.5 h-3.5" />,
  'sightseeing': <Camera className="w-3.5 h-3.5" />,
  'relaxation': <Bed className="w-3.5 h-3.5" />,
  'shopping': <ShoppingBag className="w-3.5 h-3.5" />,
  'nightlife': <Music className="w-3.5 h-3.5" />,
  'workshop': <Wrench className="w-3.5 h-3.5" />,
  'transit': <Bus className="w-3.5 h-3.5" />,
};

const PRIORITY_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  'must-see': { bg: 'bg-red-500', icon: <Star className="w-3 h-3" /> },
  'if-energy': { bg: 'bg-amber-500', icon: <Sparkles className="w-3 h-3" /> },
  'skip-guilt-free': { bg: 'bg-gray-400', icon: <AlertCircle className="w-3 h-3" /> },
};

// Convert 24-hour time to 12-hour format
function formatTime12h(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Format duration (stored in minutes) to hours display
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

export function DayCard({
  day,
  isToday,
  isExpanded = true,
  onToggle,
  onUpdateDay,
  location,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  dragOverIndex,
  onDragOver
}: DayCardProps) {
  const [editingTheme, setEditingTheme] = useState(false);
  const [themeValue, setThemeValue] = useState(day.theme || '');

  const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const handleSaveTheme = () => {
    if (onUpdateDay) {
      onUpdateDay({ ...day, theme: themeValue || undefined });
    }
    setEditingTheme(false);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<TimeBlock>) => {
    if (onUpdateDay) {
      const updatedBlocks = day.blocks.map(b =>
        b.id === blockId ? { ...b, ...updates } : b
      );
      onUpdateDay({ ...day, blocks: updatedBlocks });
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    if (onUpdateDay) {
      const updatedBlocks = day.blocks.filter(b => b.id !== blockId);
      onUpdateDay({ ...day, blocks: updatedBlocks });
    }
  };

  return (
    <Card className={cn(
      'transition-all',
      isToday && 'ring-2 ring-primary shadow-lg'
    )}>
      <CardHeader
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          onToggle && 'cursor-pointer'
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              {editingTheme ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={themeValue}
                    onChange={(e) => setThemeValue(e.target.value)}
                    placeholder="Day theme..."
                    className="h-8 w-48"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTheme();
                      if (e.key === 'Escape') setEditingTheme(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTheme}>
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTheme(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {formattedDate}
                    {isToday && (
                      <Badge variant="default" className="text-xs">Today</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {location || day.theme || 'No location set'}
                    {onUpdateDay && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100 ml-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThemeValue(day.theme || '');
                          setEditingTheme(true);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          {day.weather && (
            <div className="text-right text-sm">
              <div className="font-medium">{day.weather.condition}</div>
              <div className="text-muted-foreground">
                {day.weather.high}° / {day.weather.low}°
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent
          className="pt-0"
          onDragOver={(e) => {
            e.preventDefault();
            // If dropping at end of list
            if (onDragOver && e.currentTarget === e.target) {
              onDragOver(day.id, day.blocks.length);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (onDrop) {
              onDrop(day.id, dragOverIndex ?? day.blocks.length);
            }
          }}
        >
          <div className="space-y-3">
            {day.blocks.map((block, index) => (
              <div
                key={block.id}
                className="relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onDragOver) {
                    onDragOver(day.id, index);
                  }
                }}
              >
                {/* Drop indicator line */}
                {isDragging && dragOverIndex === index && (
                  <div className="absolute -top-1.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
                )}
                <TimeBlockCard
                  key={block.id}
                  block={block}
                  date={day.date}
                  onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  editable={!!onUpdateDay}
                  draggable={!!onDragStart}
                  onDragStart={() => onDragStart?.(block.id, day.id)}
                  onDragEnd={onDragEnd}
                />
              </div>
            ))}
            {/* Drop zone at end */}
            {isDragging && dragOverIndex === day.blocks.length && (
              <div className="h-0.5 bg-primary rounded-full" />
            )}
          </div>

          {day.notes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
              <strong>Notes:</strong> {day.notes}
            </div>
          )}

        </CardContent>
      )}
    </Card>
  );
}

interface TimeBlockCardProps {
  block: TimeBlock;
  date?: string; // ISO date string for booking URLs
  onUpdate?: (updates: Partial<TimeBlock>) => void;
  onDelete?: () => void;
  editable?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface EditFormState {
  name: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  duration: string;
  cost: string;
  notes: string;
  blockType: TimeBlockType;
  priority: ActivityPriority;
}

function TimeBlockCard({ block, date, onUpdate, onDelete, editable = false, draggable = false, onDragStart, onDragEnd }: TimeBlockCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: block.activity?.name || '',
    description: block.activity?.description || '',
    location: block.activity?.location?.name || '',
    startTime: block.startTime || '',
    endTime: block.endTime || '',
    duration: block.activity?.duration?.toString() || '60',
    cost: block.activity?.cost?.amount?.toString() || '',
    notes: block.notes || '',
    blockType: block.type,
    priority: block.priority,
  });

  // Use category color if activity exists, otherwise fall back to block type color
  const categoryColor = block.activity?.category ? CATEGORY_COLORS[block.activity.category] : null;
  const blockStyle = categoryColor || BLOCK_COLORS[block.type] || BLOCK_COLORS['transit'];
  const priorityStyle = PRIORITY_STYLES[block.priority];

  const startEditing = () => {
    setEditForm({
      name: block.activity?.name || '',
      description: block.activity?.description || '',
      location: block.activity?.location?.name || '',
      startTime: block.startTime || '',
      endTime: block.endTime || '',
      duration: block.activity?.duration?.toString() || '60',
      cost: block.activity?.cost?.amount?.toString() || '',
      notes: block.notes || '',
      blockType: block.type,
      priority: block.priority,
    });
    setIsEditing(true);
  };

  const openPlaceDetails = (location: string) => {
    setSelectedLocation(location);
  };

  const handleSave = () => {
    if (!onUpdate) return;

    const updates: Partial<TimeBlock> = {
      type: editForm.blockType,
      startTime: editForm.startTime || undefined,
      endTime: editForm.endTime || undefined,
      notes: editForm.notes || undefined,
      priority: editForm.priority,
    };

    if (editForm.name) {
      updates.activity = {
        ...(block.activity || {
          id: `act-${Date.now()}`,
          category: 'activity',
          bookingRequired: false,
          tags: [],
        }),
        name: editForm.name,
        description: editForm.description,
        duration: parseInt(editForm.duration) || 60,
        location: editForm.location ? { name: editForm.location } : undefined,
        cost: editForm.cost ? {
          amount: parseFloat(editForm.cost),
          currency: 'USD',
          isEstimate: true,
        } : undefined,
      } as Activity;
    }

    onUpdate(updates);
    setIsEditing(false);
  };

  const cyclePriority = () => {
    if (!onUpdate) return;
    const priorities: ActivityPriority[] = ['must-see', 'if-energy', 'skip-guilt-free'];
    const currentIndex = priorities.indexOf(block.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onUpdate({ priority: priorities[nextIndex] });
  };

  return (
    <>
      {/* Place Details Modal */}
      {selectedLocation && (
        <PlaceDetailsModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    <div
      className={cn(
        'p-3 rounded-lg border group/block relative transition-all',
        blockStyle,
        block.isLocked && 'ring-1 ring-primary',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={draggable && !isEditing}
      onDragStart={(e) => {
        if (!draggable || isEditing) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.id);
        // Add a slight delay to show drag preview
        setTimeout(() => {
          (e.target as HTMLElement).style.opacity = '0.5';
        }, 0);
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        (e.target as HTMLElement).style.opacity = '1';
        onDragEnd?.();
      }}
    >
      {/* Drag handle */}
      {draggable && !isEditing && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-50 hover:!opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-4 h-4 text-current" />
        </div>
      )}

      {/* Edit/Delete buttons */}
      {editable && !isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm"
            onClick={startEditing}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 bg-white/80 hover:bg-white hover:text-destructive shadow-sm"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className={cn('flex items-start gap-2', draggable && 'pl-4')}>
        <div className="flex-1 min-w-0">

          {/* Edit Form */}
          {isEditing ? (
            <div className="space-y-3 bg-white/80 rounded-lg p-3 -mx-1" onClick={(e) => e.stopPropagation()}>
              {/* Row 1: Block Type & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Block Type</Label>
                  <Select
                    value={editForm.blockType}
                    onValueChange={(v) => setEditForm({ ...editForm, blockType: v as TimeBlockType })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning-anchor">Morning Anchor</SelectItem>
                      <SelectItem value="midday-flex">Midday Flex</SelectItem>
                      <SelectItem value="evening-vibe">Evening Vibe</SelectItem>
                      <SelectItem value="rest-block">Rest Block</SelectItem>
                      <SelectItem value="transit">Transit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(v) => setEditForm({ ...editForm, priority: v as ActivityPriority })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must-see">Must-Do</SelectItem>
                      <SelectItem value="if-energy">If-Energy</SelectItem>
                      <SelectItem value="skip-guilt-free">Skip Guilt-Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Time */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Duration (min)</Label>
                  <Input
                    type="number"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Activity Name */}
              <div className="space-y-1">
                <Label className="text-xs">Activity Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="What are you doing?"
                  className="h-8"
                />
              </div>

              {/* Row 4: Location & Cost */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Address or place name"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost ($)</Label>
                  <Input
                    type="number"
                    value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Row 5: Description */}
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Details about this activity..."
                  className="min-h-[60px] text-xs"
                />
              </div>

              {/* Row 6: Notes */}
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Booking reference, tips, etc."
                  className="h-8 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : block.activity ? (
            <ActivityDisplay
              activity={block.activity}
              priority={block.priority}
              date={date}
              onOpenPlaceDetails={openPlaceDetails}
              editable={editable}
              onToggleBooked={() => {
                if (!onUpdate || !block.activity) return;
                const currentStatus = block.activity.reservationStatus;
                const newStatus = currentStatus === 'done' ? 'not-started' : 'done';
                onUpdate({
                  activity: {
                    ...block.activity,
                    reservationStatus: newStatus,
                  },
                });
              }}
            />
          ) : (
            <div className="text-sm italic opacity-70">
              {block.type === 'rest-block' ? 'Rest & recharge' : 'Flexible time'}
            </div>
          )}

          {/* Alternatives */}
          {!isEditing && block.alternatives && block.alternatives.length > 0 && (
            <div className="mt-2 pt-2 border-t border-current/10">
              <div className="text-xs font-medium mb-1 opacity-70">Alternatives:</div>
              <div className="space-y-1">
                {block.alternatives.map((alt) => (
                  <div key={alt.id} className="text-sm opacity-80">
                    • {alt.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {!isEditing && block.notes && (
            <div className="mt-2 text-xs opacity-70 italic">{block.notes}</div>
          )}
        </div>
      </div>

    </div>
    </>
  );
}

interface ActivityDisplayProps {
  activity: Activity;
  priority: string;
  date?: string; // ISO date string for booking URLs
  onOpenPlaceDetails?: (location: string) => void;
  onToggleBooked?: () => void;
  editable?: boolean;
}

function ActivityDisplay({ activity, priority, date, onOpenPlaceDetails, onToggleBooked, editable }: ActivityDisplayProps) {
  const isBooked = activity.reservationStatus === 'done';
  const categoryIcon = CATEGORY_ICONS[activity.category] || <Compass className="w-3.5 h-3.5" />;

  return (
    <div>
      {/* Compact header: icon + name + time on same line */}
      <div className="flex items-center gap-1.5">
        <span className="opacity-60 flex-shrink-0">{categoryIcon}</span>
        <span className="font-medium">{activity.name}</span>
        {activity.duration && (
          <span className="text-xs opacity-50 ml-auto flex-shrink-0">
            {formatDuration(activity.duration)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-70">
        {activity.location?.name && (
          <button
            onClick={() => onOpenPlaceDetails?.(activity.location!.name)}
            className="flex items-center gap-1 hover:opacity-100 hover:text-blue-600 transition-colors"
            title="View place details"
          >
            <MapPin className="w-3 h-3" />
            <span className="hover:underline">{activity.location.name}</span>
          </button>
        )}
        {activity.cost && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {activity.cost.amount}
          </span>
        )}
        {activity.bookingRequired && (
          <div className="flex items-center gap-1">
            {!isBooked && (
              <a
                href={generateBookingUrl(activity, { date })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-4 rounded-full bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors"
                title={`Book on ${getBookingProvider(activity.category).name}`}
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Book
              </a>
            )}
            <Badge
              variant={isBooked ? 'default' : 'outline'}
              className={cn(
                'text-[10px] px-1.5 py-0 h-4 cursor-pointer transition-colors',
                isBooked
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (editable && onToggleBooked) {
                  onToggleBooked();
                }
              }}
              title={editable ? (isBooked ? 'Click to mark as not booked' : 'Click to mark as booked') : undefined}
            >
              {isBooked ? '✓ Booked' : '○'}
            </Badge>
          </div>
        )}
      </div>
      {activity.tips && activity.tips.length > 0 && (
        <div className="mt-2 text-xs opacity-70">
          💡 {activity.tips[0]}
        </div>
      )}
    </div>
  );
}
