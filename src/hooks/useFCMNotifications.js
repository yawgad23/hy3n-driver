import { useEffect, useRef } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app as firebaseApp, db } from "@/api/firebaseClient";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

const VAPID_KEY = "BKvyYiym8HoOB_e8bhF2bZ3qStduhFtcpFYiRHCxcxI5RP3F6V97BFNtN67gYWJOEoyZsG-NSQDXHqnZP8TSdhs";
const FCM_SW_URL = "/firebase-messaging-sw.js";

/**
 * Wait for a ServiceWorkerRegistration to become active.
 */
function waitForSWActive(registration) {
  return new Promise((resolve) => {
    if (registration.active) { resolve(registration); return; }
    const sw = registration.installing || registration.waiting;
    if (!sw) { resolve(registration); return; }
    sw.addEventListener("statechange", function handler(e) {
      if (e.target.state === "activated") {
        sw.removeEventListener("statechange", handler);
        resolve(registration);
      }
    });
  });
}

/**
 * Saves the FCM token to the driver_profiles collection in Firestore.
 */
async function saveTokenToFirestore(userId, token) {
  try {
    const q = query(collection(db, "driver_profiles"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const profileDocId = snap.docs[0].id;
      await setDoc(doc(db, "driver_profiles", profileDocId), {
        fcm_token: token,
        fcm_token_updated: new Date().toISOString(),
      }, { merge: true });
      console.log("[HY3N Driver FCM] Token saved to profile:", profileDocId);
    } else {
      await setDoc(doc(db, "driver_profiles", userId), {
        user_id: userId,
        fcm_token: token,
        fcm_token_updated: new Date().toISOString(),
      }, { merge: true });
      console.log("[HY3N Driver FCM] Token saved to new profile doc:", userId);
    }
  } catch (saveErr) {
    console.warn("[HY3N Driver FCM] Failed to save token:", saveErr.message);
  }
}

/**
 * Initialises Firebase Cloud Messaging for the current driver.
 * Registers the FCM service worker, gets the FCM token, saves it to Firestore,
 * and handles foreground messages with system notifications.
 */
export function useFCMNotifications(userId) {
  const swRegRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const init = async () => {
      try {
        // Step 1: Register the FCM service worker
        let swReg = await navigator.serviceWorker.register(FCM_SW_URL, { scope: "/" });
        console.log("[HY3N Driver FCM] SW registered");

        // Step 2: Wait for SW to become active
        swReg = await waitForSWActive(swReg);
        swRegRef.current = swReg;
        console.log("[HY3N Driver FCM] SW is active");

        if (cancelled) return;

        // Step 3: Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("[HY3N Driver FCM] Permission denied");
          return;
        }

        if (cancelled) return;

        // Step 4: Get FCM token
        const messaging = getMessaging(firebaseApp);
        let token;
        try {
          token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });
        } catch (tokenErr) {
          console.warn("[HY3N Driver FCM] getToken() failed:", tokenErr.message);
          return;
        }

        if (!token) {
          console.warn("[HY3N Driver FCM] Empty token returned");
          return;
        }
        console.log("[HY3N Driver FCM] Token:", token.substring(0, 20) + "...");

        if (cancelled) return;

        // Step 5: Save token to Firestore
        await saveTokenToFirestore(userId, token);

        if (cancelled) return;

        // Step 6: Poll for token rotation every 30 minutes
        const tokenRefreshInterval = setInterval(async () => {
          if (cancelled) { clearInterval(tokenRefreshInterval); return; }
          try {
            const newToken = await getToken(messaging, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: swReg,
            });
            if (newToken && newToken !== token) {
              console.log("[HY3N Driver FCM] Token rotated — saving new token");
              await saveTokenToFirestore(userId, newToken);
            }
          } catch (e) { /* ignore */ }
        }, 30 * 60 * 1000);

        // Step 7: Handle foreground messages — show system notification via SW
        onMessage(messaging, (payload) => {
          console.log("[HY3N Driver FCM] Foreground message:", payload);
          const title = payload.notification?.title || payload.data?.title || "HY3N Driver";
          const body = payload.notification?.body || payload.data?.body || "";
          const icon = payload.notification?.icon || "/icon-192.png";
          const tag = payload.data?.tag || "hy3n-driver-foreground";

          if (Notification.permission === "granted") {
            try {
              swReg.showNotification(title, {
                body,
                icon,
                badge: "/icon-192.png",
                tag,
                vibrate: [200, 100, 200, 100, 200],
                requireInteraction: true,
                data: payload.data || {},
              });
            } catch (e) {
              new Notification(title, { body, icon, tag });
            }
          }
        });

      } catch (err) {
        console.error("[HY3N Driver FCM] Init error:", err.message);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [userId]);
}
