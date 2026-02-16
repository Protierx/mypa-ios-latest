/**
 * Purchase Context — RevenueCat Integration
 *
 * Wraps RevenueCat SDK to manage premium subscription state.
 * - Initialises on app start (after auth)
 * - Syncs `is_premium` to Supabase profile
 * - Exposes purchase / restore helpers for PaywallSheet & SoftUpsellSheet
 *
 * Reference: PRD Section 3 (Business Model), IMPLEMENTATION_PLAN 3.1
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { useSupabaseAuth } from './SupabaseAuthContext';
import { eventLogger } from '../services/eventLogger';

// ── Config ──────────────────────────────────────────────────────────────────
// Replace with your real RevenueCat API key from the dashboard
const REVENUCAT_API_KEY = Platform.select({
  ios: 'appl_REPLACE_WITH_YOUR_KEY',
  android: 'goog_REPLACE_WITH_YOUR_KEY',
  default: '',
});

const ENTITLEMENT_ID = 'premium';

// ── Types ───────────────────────────────────────────────────────────────────
interface PurchaseContextType {
  /** Whether the user has an active premium entitlement */
  isPremium: boolean;
  /** Currently available offering from RevenueCat */
  currentOffering: PurchasesOffering | null;
  /** Whether we're processing a purchase or restore */
  isProcessing: boolean;
  /** Purchase a specific package (monthly or annual) */
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  /** Restore previously purchased subscriptions */
  restorePurchases: () => Promise<{ success: boolean; isPremium: boolean; error?: string }>;
  /** Refresh entitlement status from RevenueCat */
  refreshStatus: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────────
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useSupabaseAuth();
  const [isPremium, setIsPremium] = useState(user?.isPremium ?? false);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // ── Initialise RevenueCat ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || isConfigured) return;

    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        Purchases.configure({
          apiKey: REVENUCAT_API_KEY,
          appUserID: user!.id,
        });

        setIsConfigured(true);

        // Fetch initial status
        const info = await Purchases.getCustomerInfo();
        syncPremiumState(info);

        // Fetch offerings
        const offerings = await Purchases.getOfferings();
        setCurrentOffering(offerings.current ?? null);
      } catch (err) {
        console.warn('[Purchases] Init error:', err);
      }
    }

    init();
  }, [user?.id]);

  // ── Re-check on foreground ────────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured) return;

    const handleAppState = async (state: AppStateStatus) => {
      if (state === 'active') {
        try {
          const info = await Purchases.getCustomerInfo();
          syncPremiumState(info);
        } catch {
          // silent — don't crash on background check
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isConfigured]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const syncPremiumState = useCallback(
    async (info: CustomerInfo) => {
      const premium = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPremium(premium);

      // Sync to Supabase if changed
      if (user && premium !== user.isPremium) {
        await updateProfile({ is_premium: premium }).catch(() => {});
      }
    },
    [user, updateProfile],
  );

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
      setIsProcessing(true);
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        syncPremiumState(customerInfo);

        const premium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        if (premium) {
          eventLogger.log('paywall_purchase_tapped', {
            plan: pkg.identifier,
            success: true,
          });
        }

        return { success: premium };
      } catch (err: any) {
        if (err.userCancelled) {
          return { success: false, error: 'cancelled' };
        }
        console.error('[Purchases] Purchase error:', err);
        return { success: false, error: err.message || 'Purchase failed' };
      } finally {
        setIsProcessing(false);
      }
    },
    [syncPremiumState],
  );

  const restorePurchases = useCallback(async (): Promise<{
    success: boolean;
    isPremium: boolean;
    error?: string;
  }> => {
    setIsProcessing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      syncPremiumState(customerInfo);

      const premium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      eventLogger.log('paywall_restore_tapped', { restored: premium });
      return { success: true, isPremium: premium };
    } catch (err: any) {
      console.error('[Purchases] Restore error:', err);
      return { success: false, isPremium: false, error: err.message || 'Restore failed' };
    } finally {
      setIsProcessing(false);
    }
  }, [syncPremiumState]);

  const refreshStatus = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const info = await Purchases.getCustomerInfo();
      syncPremiumState(info);
    } catch {
      // silent
    }
  }, [isConfigured, syncPremiumState]);

  return (
    <PurchaseContext.Provider
      value={{
        isPremium,
        currentOffering,
        isProcessing,
        purchasePackage,
        restorePurchases,
        refreshStatus,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function usePurchases() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) {
    throw new Error('usePurchases must be used within PurchaseProvider');
  }
  return ctx;
}
