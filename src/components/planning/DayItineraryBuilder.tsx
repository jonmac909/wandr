'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Plus,
  MapPin,
  Clock,
  Footprints,
  Car,
  X,
  Star,
  ChevronRight,
  GripVertical,
  Trash2,
  Info,
} from 'lucide-react';

// Day colors matching Trip.com style
const DAY_COLORS = [
  { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'bg-yellow-500', text: 'text-yellow-500', light: 'bg-yellow-50', border: 'border-yellow-200' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200' },
  { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50', border: 'border-purple-200' },
  { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50', border: 'border-green-200' },
  { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
];

export interface PlannedActivity {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating?: number;
  priceInfo?: string;
  hours?: string;
  duration?: number; // in minutes
  tips?: string[];
  neighborhood?: string;
  tags?: string[];
}

export interface DayPlan {
  dayNumber: number;
  label?: string; // "Arrive", "Depart"
  activities: PlannedActivity[];
}

interface DayItineraryBuilderProps {
  destination: string;
  duration: number;
  dayPlans: DayPlan[];
  onDayPlansChange: (plans: DayPlan[]) => void;
  availableActivities: PlannedActivity[];
}

// Estimate walking time between activities (mock - in real app would use Google Maps API)
function estimateTravelTime(from: PlannedActivity, to: PlannedActivity): { minutes: number; mode: 'walk' | 'drive' } {
  // Simple mock - in reality would calculate based on location
  const randomMinutes = Math.floor(Math.random() * 20) + 5;
  return {
    minutes: randomMinutes,
    mode: randomMinutes > 15 ? 'drive' : 'walk',
  };
}

export function DayItineraryBuilder({
  destination,
  duration,
  dayPlans,
  onDayPlansChange,
  availableActivities,
}: DayItineraryBuilderProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [activityBrowserOpen, setActivityBrowserOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<PlannedActivity | null>(null);

  const getDayColors = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];

  const addActivityToDay = (activity: PlannedActivity, dayIndex: number) => {
    const newPlans = [...dayPlans];
    if (!newPlans[dayIndex]) {
      newPlans[dayIndex] = { dayNumber: dayIndex + 1, activities: [] };
    }
    // Check if activity already exists in this day
    if (!newPlans[dayIndex].activities.find(a => a.id === activity.id)) {
      newPlans[dayIndex].activities.push(activity);
      onDayPlansChange(newPlans);
    }
    setActivityBrowserOpen(false);
  };

  const removeActivityFromDay = (activityId: string, dayIndex: number) => {
    const newPlans = [...dayPlans];
    newPlans[dayIndex].activities = newPlans[dayIndex].activities.filter(a => a.id !== activityId);
    onDayPlansChange(newPlans);
  };

  const moveActivity = (dayIndex: number, fromIndex: number, toIndex: number) => {
    const newPlans = [...dayPlans];
    const activities = [...newPlans[dayIndex].activities];
    const [removed] = activities.splice(fromIndex, 1);
    activities.splice(toIndex, 0, removed);
    newPlans[dayIndex].activities = activities;
    onDayPlansChange(newPlans);
  };

  // Get activities not yet assigned to any day
  const getUnassignedActivities = () => {
    const assignedIds = new Set(dayPlans.flatMap(d => d.activities.map(a => a.id)));
    return availableActivities.filter(a => !assignedIds.has(a.id));
  };

  const currentDayPlan = dayPlans[selectedDay] || { dayNumber: selectedDay + 1, activities: [] };
  const colors = getDayColors(selectedDay);

  return (
    <div className="space-y-4">
      {/* Day Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: duration }, (_, i) => {
          const dayColors = getDayColors(i);
          const dayPlan = dayPlans[i];
          const activityCount = dayPlan?.activities.length || 0;
          const isSelected = selectedDay === i;

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                isSelected
                  ? `${dayColors.light} ${dayColors.border} border-2 ring-2 ring-offset-1 ring-${dayColors.bg.replace('bg-', '')}/30`
                  : 'bg-muted/50 border border-border hover:bg-muted'
              }`}
            >
              <div className={`text-xs font-medium ${isSelected ? dayColors.text : 'text-muted-foreground'}`}>
                Day {i + 1}
              </div>
              <div className={`text-lg font-bold ${isSelected ? '' : 'text-foreground'}`}>
                {i === 0 ? 'Arrive' : i === duration - 1 ? 'Depart' : activityCount > 0 ? `${activityCount}` : '—'}
              </div>
              {activityCount > 0 && i !== 0 && i !== duration - 1 && (
                <div className="text-[10px] text-muted-foreground">activities</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
          <h3 className="font-semibold">Day {selectedDay + 1} Route</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActivityBrowserOpen(true)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Activity
        </Button>
      </div>

      {/* Timeline View */}
      <div className="relative">
        {currentDayPlan.activities.length === 0 ? (
          <Card className={`${colors.light} ${colors.border} border-dashed`}>
            <CardContent className="py-12 text-center">
              <MapPin className={`w-8 h-8 mx-auto mb-3 ${colors.text} opacity-50`} />
              <p className="text-sm text-muted-foreground mb-3">
                No activities planned for Day {selectedDay + 1}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivityBrowserOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-0">
            {currentDayPlan.activities.map((activity, index) => (
              <div key={activity.id}>
                {/* Activity Card */}
                <ActivityTimelineCard
                  activity={activity}
                  dayColors={colors}
                  onRemove={() => removeActivityFromDay(activity.id, selectedDay)}
                  onViewDetails={() => setSelectedActivity(activity)}
                  isFirst={index === 0}
                  isLast={index === currentDayPlan.activities.length - 1}
                />

                {/* Travel Time Connector */}
                {index < currentDayPlan.activities.length - 1 && (
                  <TravelTimeConnector
                    from={activity}
                    to={currentDayPlan.activities[index + 1]}
                    dayColors={colors}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Browser Sheet */}
      <Sheet open={activityBrowserOpen} onOpenChange={setActivityBrowserOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle>Add Activity to Day {selectedDay + 1}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto h-[calc(100%-60px)] pb-safe">
            {getUnassignedActivities().length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>All activities have been assigned to days</p>
              </div>
            ) : (
              getUnassignedActivities().map((activity) => (
                <ActivityPickerCard
                  key={activity.id}
                  activity={activity}
                  onAdd={() => addActivityToDay(activity, selectedDay)}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {selectedActivity && (
            <>
              <div className="relative h-48 w-full">
                <img
                  src={selectedActivity.imageUrl}
                  alt={selectedActivity.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {selectedActivity.rating && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold">{selectedActivity.rating}</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <DialogHeader>
                  <DialogTitle className={`text-lg ${colors.text}`}>{selectedActivity.name}</DialogTitle>
                </DialogHeader>

                {selectedActivity.priceInfo && (
                  <div className="text-sm">
                    <span className="font-medium">Admission:</span>{' '}
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">{selectedActivity.priceInfo}</span>
                  </div>
                )}

                {selectedActivity.hours && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{selectedActivity.hours}</span>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>

                {selectedActivity.tips && selectedActivity.tips.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs font-medium mb-1">
                      <Info className="w-3 h-3" />
                      Tips
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {selectedActivity.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedActivity.tags && selectedActivity.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedActivity.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Timeline activity card
function ActivityTimelineCard({
  activity,
  dayColors,
  onRemove,
  onViewDetails,
  isFirst,
  isLast,
}: {
  activity: PlannedActivity;
  dayColors: typeof DAY_COLORS[0];
  onRemove: () => void;
  onViewDetails: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${dayColors.bg} ring-4 ring-background z-10`} />
        {!isLast && <div className={`w-0.5 flex-1 ${dayColors.bg} opacity-30`} />}
      </div>

      {/* Activity Content */}
      <button
        onClick={onViewDetails}
        className={`flex-1 mb-2 p-3 rounded-xl ${dayColors.light} ${dayColors.border} border text-left transition-all hover:shadow-md active:scale-[0.99]`}
      >
        <div className="flex gap-3">
          {/* Image */}
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${dayColors.text} line-clamp-1`}>
              {activity.name}
            </h4>

            {activity.priceInfo && (
              <p className="text-xs text-foreground mt-0.5">
                <span className="bg-background/80 px-1.5 py-0.5 rounded">{activity.priceInfo}</span>
              </p>
            )}

            {activity.hours && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.hours}
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          </div>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded-full hover:bg-background/80 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </button>
    </div>
  );
}

// Travel time connector between activities
function TravelTimeConnector({
  from,
  to,
  dayColors,
}: {
  from: PlannedActivity;
  to: PlannedActivity;
  dayColors: typeof DAY_COLORS[0];
}) {
  const travel = estimateTravelTime(from, to);

  return (
    <div className="flex gap-3 py-1">
      {/* Timeline spacer */}
      <div className="flex flex-col items-center w-3">
        <div className={`w-0.5 h-full ${dayColors.bg} opacity-30`} style={{ minHeight: '24px' }} />
      </div>

      {/* Travel info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {travel.mode === 'walk' ? (
          <Footprints className="w-3 h-3" />
        ) : (
          <Car className="w-3 h-3" />
        )}
        <span>{travel.minutes}-minute {travel.mode}</span>
      </div>
    </div>
  );
}

// Activity picker card for the browser sheet
function ActivityPickerCard({
  activity,
  onAdd,
}: {
  activity: PlannedActivity;
  onAdd: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-1">{activity.name}</h4>
            {activity.neighborhood && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {activity.neighborhood}
              </p>
            )}
            {activity.rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs">{activity.rating}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          </div>

          {/* Add button */}
          <Button size="sm" variant="outline" onClick={onAdd} className="self-center">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
