// Billing Routes
import { Router, Request, Response } from 'express';
import { stripeService, SubscriptionTier } from '../services/stripe';
import { success, error, badRequest, serverError } from '../utils/response';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get subscription plans
router.get('/plans', (_req: Request, res: Response) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceId: '',
      features: [
        'Up to 10 studies per month',
        'Basic AI analysis',
        'Email support',
        'Community access',
      ],
      limits: {
        studies: 10,
        storage: '1GB',
        users: 1,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      priceId: process.env.STRIPE_PRICE_ID_PRO || '',
      features: [
        'Up to 100 studies per month',
        'Advanced AI analysis',
        'Priority support',
        'API access',
        'Custom integrations',
      ],
      limits: {
        studies: 100,
        storage: '50GB',
        users: 5,
      },
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
      features: [
        'Unlimited studies',
        'Full AI analysis suite',
        'Dedicated support',
        'Unlimited users',
        'Custom integrations',
        'HIPAA compliance',
        'SLA guarantee',
      ],
      limits: {
        studies: -1, // unlimited
        storage: '500GB',
        users: -1, // unlimited
      },
    },
  ];

  return success(res, plans);
});

// Create checkout session (requires authentication)
router.post('/checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tier, successUrl, cancelUrl } = req.body;

    if (!tier || !['free', 'pro', 'enterprise'].includes(tier)) {
      return badRequest(res, 'Invalid subscription tier');
    }

    if (!successUrl || !cancelUrl) {
      return badRequest(res, 'successUrl and cancelUrl are required');
    }

    // For free tier, don't create a checkout session
    if (tier === 'free') {
      return success(res, { message: 'Free tier selected', tier });
    }

    const userId = req.user?.id;
    const email = req.user?.email;
    const name = req.user?.fullName;

    const session = await stripeService.createCheckoutSession({
      userId,
      email,
      tier: tier as SubscriptionTier,
      successUrl,
      cancelUrl,
    });

    return success(res, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return serverError(res, 'Failed to create checkout session');
  }
});

// Get billing portal session (requires authentication)
router.post('/portal', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { returnUrl } = req.body;

    if (!returnUrl) {
      return badRequest(res, 'returnUrl is required');
    }

    const customerId = (req.user as unknown as Record<string, unknown>)?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return error(res, 'no_billing_account', 'No billing account found', undefined, 400);
    }

    const session = await stripeService.createBillingPortalSession({
      customerId,
      returnUrl,
    });

    return success(res, {
      url: session.url,
    });
  } catch (err) {
    console.error('Portal error:', err);
    return serverError(res, 'Failed to create billing portal session');
  }
});

// Get subscription status (requires authentication)
router.get('/subscription', authenticateToken, async (req: Request, res: Response) => {
  try {
    const customerId = (req.user as unknown as Record<string, unknown>)?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return success(res, {
        subscription: null,
        tier: 'free',
      });
    }

    const subscription = await stripeService.getSubscription(customerId);

    return success(res, {
      subscription,
      tier: subscription?.tier || 'free',
    });
  } catch (err) {
    console.error('Get subscription error:', err);
    return serverError(res, 'Failed to get subscription');
  }
});

// Cancel subscription (requires authentication)
router.post('/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId, immediate } = req.body;

    if (!subscriptionId) {
      return badRequest(res, 'subscriptionId is required');
    }

    const subscription = await stripeService.cancelSubscription(
      subscriptionId,
      immediate !== true
    );

    return success(res, {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return serverError(res, 'Failed to cancel subscription');
  }
});

// Reactivate subscription (requires authentication)
router.post('/reactivate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return badRequest(res, 'subscriptionId is required');
    }

    const subscription = await stripeService.reactivateSubscription(subscriptionId);

    return success(res, {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error('Reactivate subscription error:', err);
    return serverError(res, 'Failed to reactivate subscription');
  }
});

// Stripe webhook handler (no authentication - uses signature verification)
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return badRequest(res, 'Missing stripe-signature header');
    }

    try {
      const body = JSON.stringify(req.body);
      const event = await stripeService.handleWebhook(body, signature as string);
      await stripeService.processWebhookEvent(event);

      return success(res, { received: true });
    } catch (err) {
      console.error('Webhook error:', err);
      return badRequest(res, 'Webhook verification failed');
    }
  }
);

export { router as billingRouter };
