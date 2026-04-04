// Billing API Client
import { apiClient } from './client';

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    studies: number;
    storage: string;
    users: number;
  };
  popular?: boolean;
}

export interface SubscriptionInfo {
  customerId: string;
  subscriptionId: string;
  status: string;
  tier: 'free' | 'pro' | 'enterprise';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export const billingApi = {
  // Get available plans
  getPlans: async (): Promise<Plan[]> => {
    return apiClient.get<Plan[]>('/billing/plans');
  },

  // Create checkout session
  createCheckout: async (tier: 'free' | 'pro' | 'enterprise', successUrl: string, cancelUrl: string) => {
    return apiClient.post<{ sessionId: string; url: string }>('/billing/checkout', {
      tier,
      successUrl,
      cancelUrl,
    });
  },

  // Get billing portal session
  createPortal: async (returnUrl: string) => {
    return apiClient.post<{ url: string }>('/billing/portal', {
      returnUrl,
    });
  },

  // Get current subscription
  getSubscription: async (): Promise<{ subscription: SubscriptionInfo | null; tier: string }> => {
    return apiClient.get<{ subscription: SubscriptionInfo | null; tier: string }>('/billing/subscription');
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string, immediate?: boolean) => {
    return apiClient.post<{ subscription: { id: string; status: string; cancelAtPeriodEnd: boolean } }>(
      '/billing/cancel',
      {
        subscriptionId,
        immediate,
      }
    );
  },

  // Reactivate subscription
  reactivateSubscription: async (subscriptionId: string) => {
    return apiClient.post<{ subscription: { id: string; status: string; cancelAtPeriodEnd: boolean } }>(
      '/billing/reactivate',
      {
        subscriptionId,
      }
    );
  },
};
