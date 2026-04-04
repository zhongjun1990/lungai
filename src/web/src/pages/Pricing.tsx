import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi, Plan } from '../api/billing';
import { useStore } from '../store/useStore';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await billingApi.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setProcessing(plan.id);

    try {
      if (plan.id === 'free') {
        // For free tier, just update the user preference
        navigate('/dashboard');
      } else {
        const origin = window.location.origin;
        const result = await billingApi.createCheckout(
          plan.id as 'free' | 'pro' | 'enterprise',
          `${origin}/dashboard?billing=success`,
          `${origin}/pricing?billing=cancelled`
        );

        if (result.url) {
          window.location.href = result.url;
        }
      }
    } catch (error) {
      console.error('Failed to select plan:', error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Choose the plan that fits your needs. All plans include our core AI imaging analysis features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card relative ${
              plan.popular ? 'border-primary shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white text-sm font-medium px-4 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="card-header text-center">
              <h2 className="text-2xl font-bold text-text">{plan.name}</h2>
              <div className="mt-4">
                <span className="text-4xl font-bold text-text">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted">/month</span>
                )}
              </div>
            </div>

            <div className="card-body">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-success mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted mb-2">Limits:</p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>
                    {plan.limits.studies === -1
                      ? 'Unlimited studies'
                      : `Up to ${plan.limits.studies} studies/month`}
                  </li>
                  <li>
                    {plan.limits.storage} storage
                  </li>
                  <li>
                    {plan.limits.users === -1
                      ? 'Unlimited users'
                      : `${plan.limits.users} user${plan.limits.users !== 1 ? 's' : ''}`}
                  </li>
                </ul>
              </div>
            </div>

            <div className="card-footer">
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={processing !== null}
                className={`w-full btn ${
                  plan.popular ? 'btn-primary' : 'btn-secondary'
                } ${processing === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {processing === plan.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : plan.price === 0 ? (
                  'Get Started Free'
                ) : (
                  `Choose ${plan.name}`
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-xl font-semibold text-text mb-4">Need a custom solution?</h3>
        <p className="text-muted mb-6">
          Contact us for enterprise pricing with custom integrations, dedicated support, and SLA guarantees.
        </p>
        <button className="btn btn-outline">
          Contact Sales
        </button>
      </div>
    </div>
  );
};

export default Pricing;
