import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { GlassCard } from "./glass-card";
import { MagneticButton } from "./magnetic-button";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  User,
  Shield,
  Package,
  AlertCircle
} from "lucide-react";

interface RecoveryTimelineScreenProps {
  onNavigate: (screen: string) => void;
  itemId?: string;
}

interface TimelineEvent {
  id: string;
  type: 'reported' | 'matched' | 'verified' | 'handover' | 'completed';
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  user?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export function RecoveryTimelineScreen({ onNavigate, itemId }: RecoveryTimelineScreenProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from API based on itemId
    const mockEvents: TimelineEvent[] = [
      {
        id: '1',
        type: 'reported',
        title: 'Item Reported Lost',
        description: 'Blue iPhone 14 Pro reported lost at Central Park',
        timestamp: '2024-01-15T10:30:00Z',
        location: 'Central Park, New York',
        user: 'John Doe',
        status: 'completed'
      },
      {
        id: '2',
        type: 'matched',
        title: 'AI Match Found',
        description: 'System found 3 potential matches with 94% confidence',
        timestamp: '2024-01-15T11:15:00Z',
        status: 'completed'
      },
      {
        id: '3',
        type: 'verified',
        title: 'Ownership Verified',
        description: 'Owner answered verification questions correctly',
        timestamp: '2024-01-15T14:20:00Z',
        user: 'John Doe',
        status: 'completed'
      },
      {
        id: '4',
        type: 'handover',
        title: 'Handover Scheduled',
        description: 'Meeting arranged at Starbucks Times Square',
        timestamp: '2024-01-16T15:00:00Z',
        location: 'Starbucks Times Square',
        status: 'current'
      },
      {
        id: '5',
        type: 'completed',
        title: 'Item Returned',
        description: 'Item successfully returned to rightful owner',
        timestamp: '2024-01-16T15:30:00Z',
        location: 'Starbucks Times Square',
        status: 'upcoming'
      }
    ];

    setTimeout(() => {
      setTimelineEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, [itemId]);

  const getEventIcon = (type: string, status: string) => {
    const iconProps = { className: "w-6 h-6" };

    if (status === 'completed') {
      return <CheckCircle2 {...iconProps} className="w-6 h-6 text-[#14b8a6]" />;
    }

    switch (type) {
      case 'reported':
        return <Package {...iconProps} className="w-6 h-6 text-[#06b6d4]" />;
      case 'matched':
        return <AlertCircle {...iconProps} className="w-6 h-6 text-[#f59e0b]" />;
      case 'verified':
        return <Shield {...iconProps} className="w-6 h-6 text-[#10b981]" />;
      case 'handover':
        return <MapPin {...iconProps} className="w-6 h-6 text-[#8b5cf6]" />;
      case 'completed':
        return <CheckCircle2 {...iconProps} className="w-6 h-6 text-[#14b8a6]" />;
      default:
        return <Circle {...iconProps} className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0a0e1a] to-[#1e293b]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-16 h-16 text-[#06b6d4]" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          whileHover={{ x: -5 }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-8 h-8 text-[#14b8a6]" />
            </motion.div>
            <h1 className="text-4xl font-bold">Recovery Timeline</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track the complete journey of your item's recovery
          </p>
        </motion.div>

        <GlassCard className="p-8">
          <div className="space-y-8">
            {timelineEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-[#06b6d4] to-transparent" />
                )}

                <div className="flex items-start gap-6">
                  {/* Event icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 border-2 border-white/20
                    flex items-center justify-center relative z-10">
                    {getEventIcon(event.type, event.status)}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatDate(event.timestamp)}
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-3">{event.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {event.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.user && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          {event.user}
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="mt-3">
                      {event.status === 'current' && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          bg-[#06b6d4]/20 text-[#06b6d4] text-sm font-medium">
                          <div className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
                          In Progress
                        </span>
                      )}
                      {event.status === 'upcoming' && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                          bg-muted/50 text-muted-foreground text-sm font-medium">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Progress summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#14b8a6] mb-2">
                  {timelineEvents.filter(e => e.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Steps Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#06b6d4] mb-2">
                  {Math.round((timelineEvents.filter(e => e.status === 'completed').length / timelineEvents.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Recovery Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#f59e0b] mb-2">
                  {Math.floor((new Date(timelineEvents[timelineEvents.length - 1]?.timestamp || Date.now()).getTime() -
                    new Date(timelineEvents[0]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-muted-foreground">Days to Recovery</div>
              </div>
            </div>
          </motion.div>
        </GlassCard>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <MagneticButton variant="ghost" onClick={() => onNavigate('home')}>
            Return to Home
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
}
