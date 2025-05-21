import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DirectCheckoutButtonProps {
  planId: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function DirectCheckoutButton({ 
  planId, 
  children, 
  variant = 'default',
  className = '' 
}: DirectCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Log for debugging
      console.log('Creating checkout session for plan:', planId);
      
      // Direct API call to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Checkout error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Checkout response:', data);
      
      if (data.checkoutUrl) {
        // Open in a new tab first
        const checkoutWindow = window.open(data.checkoutUrl, '_blank');
        
        // If popup blocked, try direct navigation
        if (!checkoutWindow || checkoutWindow.closed || typeof checkoutWindow.closed === 'undefined') {
          toast({
            title: 'Opening payment page',
            description: 'Please click OK to proceed to payment'
          });
          
          // Small delay to ensure toast is seen
          setTimeout(() => {
            window.location.href = data.checkoutUrl;
          }, 1500);
        }
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      toast({
        variant: 'destructive',
        title: 'Checkout Error',
        description: 'Could not open the payment page. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      className={className}
      variant={variant} 
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </span>
      ) : children}
    </Button>
  );
}