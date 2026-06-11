import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Car, CheckCircle, XCircle, Clock, CreditCard, AlertCircle, Info, Star } from "lucide-react";
import { db } from "@/api/firebaseClient";
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { firebaseClient } from "@/api/firebaseClient";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  ride_accepted:        { icon: Car,          color: "text-blue-500",   bg: "bg-blue-500/10"   },
  ride_completed:       { icon: CheckCircle,  color: "text-green-500",  bg: "bg-green-500/10"  },
  ride_cancelled:       { icon: XCircle,      color: "text-red-500",    bg: "bg-red-500/10"    },
  commission_paid:      { icon: CreditCard,   color: "text-green-500",  bg: "bg-green-500/10"  },
  commission_rejected:  { icon: AlertCircle,  color: "text-red-500",    bg: "bg-red-500/10"    },
  commission_pending:   { icon: Clock,        color: "text-amber-500",  bg: "bg-amber-500/10"  },
  support_reply:        { icon: Info,         color: "text-blue-500",   bg: "bg-blue-500/10"   },
  rating_received:      { icon: Star,         color: "text-amber-400",  bg: "bg-amber-400/10"  },
  general:              { icon: Bell,         color: "text-primary",    bg: "bg-primary/10"    },
};

export default function DriverNotificationCenter({ isOpen, onClose, driverId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !driverId) return;
    setLoading(true);

    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("user_id", "==", driverId),
      orderBy("created_date", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(items);
      setLoading(false);
    }, () => {
      loadFromRides();
    });

    return () => unsub?.();
  }, [isOpen, driverId]);

  const loadFromRides = async () => {
    try {
      const rides = await firebaseClient.entities.Ride.filter({ driver_id: driverId });
      const commissions = await firebaseClient.entities.CommissionPayment?.filter?.({ driver_id: driverId }) || [];

      const rideNotifs = rides
        .filter(r => r.status === "completed" || r.status === "cancelled")
        .sort((a, b) => (b.completed_at || b.created_date || "").localeCompare(a.completed_at || a.created_date || ""))
        .slice(0, 15)
        .map(r => ({
          id: `ride_${r.id}`,
          type: r.status === "completed" ? "ride_completed" : "ride_cancelled",
          title: r.status === "completed" ? "Trip Completed" : "Trip Cancelled",
          body: r.status === "completed"
            ? `Trip to ${r.destination_address || "destination"} completed. Fare: GH₵${r.final_fare || r.fare_estimate || "—"}`
            : `Trip to ${r.destination_address || "destination"} was cancelled.`,
          created_date: r.completed_at || r.cancelled_at || r.created_date,
          read: true,
        }));

      const commissionNotifs = commissions
        .slice(0, 10)
        .map(c => ({
          id: `comm_${c.id}`,
          type: c.status === "confirmed" ? "commission_paid" : c.status === "rejected" ? "commission_rejected" : "commission_pending",
          title: c.status === "confirmed" ? "Commission Confirmed" : c.status === "rejected" ? "Commission Rejected" : "Commission Pending",
          body: c.status === "confirmed"
            ? `Your GH₵${c.amount || 50} daily commission was confirmed. You're ready to go!`
            : c.status === "rejected"
            ? `Your commission payment was rejected. Please resubmit with the correct reference.`
            : `Your GH₵${c.amount || 50} commission is awaiting admin confirmation.`,
          created_date: c.created_date,
          read: c.status !== "pending",
        }));

      const all = [...rideNotifs, ...commissionNotifs].sort((a, b) =>
        (b.created_date || "").localeCompare(a.created_date || "")
      );
      setNotifications(all);
    } catch (err) {
      console.warn("Driver notification fallback error:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read && !n.id.startsWith("ride_") && !n.id.startsWith("comm_"));
    for (const n of unread) {
      try {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      } catch {}
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 top-0 z-50 bg-[#0f1117] rounded-b-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: "85vh" }}
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary font-semibold">
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 72px)" }}>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Bell className="w-12 h-12 text-white/20 mb-3" />
                  <p className="font-semibold text-white">No notifications yet</p>
                  <p className="text-sm text-white/50 mt-1">Trip updates, commission status, and more will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.map((notif) => {
                    const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
                    const Icon = config.icon;
                    const timeAgo = notif.created_date
                      ? formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })
                      : "";
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-5 py-4 ${!notif.read ? "bg-white/5" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold leading-snug ${!notif.read ? "text-white" : "text-white/80"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notif.body && (
                            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{notif.body}</p>
                          )}
                          {timeAgo && (
                            <p className="text-[11px] text-white/30 mt-1">{timeAgo}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
