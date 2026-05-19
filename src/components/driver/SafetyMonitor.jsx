import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Activity,
  Zap,
  RotateCcw,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SafetyMonitor({ isActive, tripId }) {
  const [safetyData, setSafetyData] = useState({
    currentSpeed: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    hardBraking: 0,
    rapidAcceleration: 0,
    sharpTurns: 0,
    safetyScore: 100,
  });

  const [events, setEvents] = useState([]);

  // Simulate safety monitoring (in real app, use device sensors)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate speed variations
      const newSpeed = Math.floor(Math.random() * 40) + 30; // 30-70 km/h
      
      // Randomly generate safety events
      const eventTypes = ['hard_braking', 'rapid_acceleration', 'sharp_turn'];
      const randomEvent = Math.random() > 0.85 ? eventTypes[Math.floor(Math.random() * 3)] : null;

      if (randomEvent) {
        const event = {
          type: randomEvent,
          time: new Date().toLocaleTimeString(),
          severity: Math.random() > 0.7 ? 'high' : 'medium',
        };
        
        setEvents(prev => [event, ...prev.slice(0, 9)]);
        
        setSafetyData(prev => ({
          ...prev,
          currentSpeed: newSpeed,
          maxSpeed: Math.max(prev.maxSpeed, newSpeed),
          hardBraking: randomEvent === 'hard_braking' ? prev.hardBraking + 1 : prev.hardBraking,
          rapidAcceleration: randomEvent === 'rapid_acceleration' ? prev.rapidAcceleration + 1 : prev.rapidAcceleration,
          sharpTurns: randomEvent === 'sharp_turn' ? prev.sharpTurns + 1 : prev.sharpTurns,
          safetyScore: Math.max(0, prev.safetyScore - (event.severity === 'high' ? 5 : 2)),
        }));
      } else {
        setSafetyData(prev => ({
          ...prev,
          currentSpeed: newSpeed,
          averageSpeed: Math.round((prev.averageSpeed * prev.readings + newSpeed) / (prev.readings + 1)),
          maxSpeed: Math.max(prev.maxSpeed, newSpeed),
          readings: (prev.readings || 0) + 1,
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive]);

  const getSafetyScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSafetyScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'hard_braking': return <AlertTriangle className="w-4 h-4" />;
      case 'rapid_acceleration': return <Zap className="w-4 h-4" />;
      case 'sharp_turn': return <RotateCcw className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'hard_braking': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'rapid_acceleration': return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case 'sharp_turn': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Safety Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            Start a trip to begin safety monitoring
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Safety Score */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base">Safety Score</CardTitle>
            <Badge className={cn("bg-primary/10", getSafetyScoreColor(safetyData.safetyScore))}>
              {getSafetyScoreLabel(safetyData.safetyScore)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn("text-4xl font-bold font-heading", getSafetyScoreColor(safetyData.safetyScore))}>
              {safetyData.safetyScore}
            </div>
            <div className="flex-1">
              <Progress 
                value={safetyData.safetyScore} 
                className="h-3"
                indicatorClassName={cn(
                  safetyData.safetyScore >= 80 ? "bg-green-500" :
                  safetyData.safetyScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Based on driving behavior during this trip
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Speed Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="font-heading text-xl font-bold text-primary">
                {safetyData.currentSpeed} <span className="text-xs">km/h</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="font-heading text-xl font-bold">
                {safetyData.averageSpeed || safetyData.currentSpeed} <span className="text-xs">km/h</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Max</p>
              <p className="font-heading text-xl font-bold text-accent">
                {safetyData.maxSpeed} <span className="text-xs">km/h</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Events */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-chart-3" />
            Safety Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold font-heading text-red-500">
                {safetyData.hardBraking}
              </p>
              <p className="text-xs text-red-500/80">Hard Braking</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Zap className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold font-heading text-orange-500">
                {safetyData.rapidAcceleration}
              </p>
              <p className="text-xs text-orange-500/80">Rapid Accel</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <RotateCcw className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold font-heading text-yellow-500">
                {safetyData.sharpTurns}
              </p>
              <p className="text-xs text-yellow-500/80">Sharp Turns</p>
            </div>
          </div>

          {/* Recent Events Log */}
          {events.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground font-medium">Recent Events:</p>
              {events.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border text-xs",
                    getEventColor(event.type)
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <span className="font-medium capitalize">
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-muted-foreground">{event.time}</span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}