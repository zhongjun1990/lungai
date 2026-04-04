// Stripe Billing Service
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionInfo {
  customerId: string;
  subscriptionId: string;
  status: Stripe.Subscription.Status;
  tier: SubscriptionTier;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  tier: SubscriptionTier;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateBillingPortalParams {
  customerId: string;
  returnUrl: string;
}

class StripeService {
  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
          platform: 'medical-imaging-saas',
        },
      });
      logger.info(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  }

  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    // Check if customer exists in our database first
    // For now, create a new customer
    const customer = await this.createCustomer(email, name);
    return customer.id;
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const priceId = this.getPriceIdForTier(params.tier);

    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: params.email,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          tier: params.tier,
        },
        subscription_data: {
          metadata: {
            userId: params.userId,
          },
        },
      });
      logger.info(`Created checkout session: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  async createBillingPortalSession(params: CreateBillingPortalParams): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
      logger.info(`Created billing portal session: ${session.id}`);
      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session:', error);
      throw error;
    }
  }

  async getSubscription(customerId: string): Promise<SubscriptionInfo | null> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return null;
      }

      const subscription = subscriptions.data[0];
      const tier = this.getTierFromPriceId(subscription.items.data[0]?.price.id);

      return {
        customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
        tier,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      logger.error('Failed to get subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      let subscription: Stripe.Subscription;
      if (atPeriodEnd) {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      }
      logger.info(`Cancelled subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });
      logger.info(`Reactivated subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to reactivate subscription:', error);
      throw error;
    }
  }

  async handleWebhook(body: string, signature: string): Promise<Stripe.Event> {
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw error;
    }
  }

  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info(`Checkout completed for customer: ${session.customer}`);
        // Update user's subscription status in database
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`Subscription updated: ${subscription.id}`);
        // Sync subscription status with database
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`Subscription cancelled: ${subscription.id}`);
        // Update user's subscription status in database
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info(`Payment succeeded for customer: ${invoice.customer}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info(`Payment failed for customer: ${invoice.customer}`);
        // Send notification to user
        break;
      }
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private getPriceIdForTier(tier: SubscriptionTier): string {
    switch (tier) {
      case 'free':
        return config.stripe.priceIds.free;
      case 'pro':
        return config.stripe.priceIds.pro;
      case 'enterprise':
        return config.stripe.priceIds.enterprise;
    }
  }

  private getTierFromPriceId(priceId: string | undefined): SubscriptionTier {
    if (priceId === config.stripe.priceIds.pro) return 'pro';
    if (priceId === config.stripe.priceIds.enterprise) return 'enterprise';
    return 'free';
  }
}

export const stripeService = new StripeService();
