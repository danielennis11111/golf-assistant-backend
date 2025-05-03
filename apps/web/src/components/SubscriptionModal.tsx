import React, { useState } from 'react';
import './SubscriptionModal.css';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('https://golf-assistant-backend.onrender.com/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Upgrade to Pro</h2>
        <p className="price">$5/month</p>
        <ul className="features">
          <li>✓ Unlimited AI-powered club recommendations</li>
          <li>✓ Advanced putting analysis</li>
          <li>✓ Personalized shot trajectory suggestions</li>
          <li>✓ Wind and terrain adjustments</li>
        </ul>
        <div className="email-input">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button
          className="subscribe-button"
          onClick={handleSubscribe}
          disabled={isLoading || !email}
        >
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </div>
  );
}; 