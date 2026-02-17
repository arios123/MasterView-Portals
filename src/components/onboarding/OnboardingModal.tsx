import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { onboardingSteps } from './onboardingSteps';
import { HighlightOverlay } from './HighlightOverlay';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

export function OnboardingModal() {
  const { state, nextStep, previousStep, skipAll, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);
  
  const step = onboardingSteps[state.step];
  const isLastStep = state.step === onboardingSteps.length - 1;
  const isFirstStep = state.step === 0;

  // Safety check: if step is undefined (out of bounds), don't render
  if (!step) {
    console.error('[OnboardingModal] Invalid step:', state.step, '- Max step is:', onboardingSteps.length - 1);
    return null;
  }

  // Update highlighted element when step changes
  useEffect(() => {
    // Step 6 (index 5): Skip highlighting on mobile for Advanced tab
    if (isMobile && state.step === 5) {
      setHighlightedElement(null);
      return;
    }
    
    if (step?.highlightTarget) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Support comma-separated targets - check if at least one exists
        const targets = step.highlightTarget.split(',').map(t => t.trim());
        let foundElement: Element | null = null;
        
        for (const target of targets) {
          const element = document.querySelector(`[data-onboarding-highlight="${target}"]`);
          if (element) {
            foundElement = element;
            break;
          }
        }
        
        if (foundElement) {
          // At least one element exists, pass the full comma-separated string to HighlightOverlay
          setHighlightedElement(step.highlightTarget);
        } else {
          // Elements don't exist yet, try a few more times with longer delays
          let retries = 0;
          const maxRetries = 30; // Try for up to 3 seconds with faster checks
          const checkInterval = setInterval(() => {
            retries++;
            let checkFound = false;
            for (const target of targets) {
              const checkElement = document.querySelector(`[data-onboarding-highlight="${target}"]`);
              if (checkElement) {
                checkFound = true;
                break;
              }
            }
            
            if (checkFound) {
              setHighlightedElement(step.highlightTarget);
              clearInterval(checkInterval);
            } else if (retries >= maxRetries) {
              // Give up after max retries - elements don't exist
              console.warn(`Onboarding highlight target(s) not found after retries: ${step.highlightTarget}`);
              setHighlightedElement(null);
              clearInterval(checkInterval);
            }
          }, 100); // Check every 100ms for faster detection
          
          return () => clearInterval(checkInterval);
        }
      }, 50); // Initial delay reduced to 50ms for faster response
    } else {
      setHighlightedElement(null);
    }
  }, [step, state.step, isMobile]);

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      nextStep();
    }
  };

  const handleSkipAll = async () => {
    await skipAll();
    toast({
      title: 'Onboarding Skipped',
    });
  };

  const handleComplete = async () => {
    setHighlightedElement(null);
    await completeOnboarding();
    toast({
      title: 'Welcome! 🎉',
      description: 'You\'re all set up. Enjoy using your workspace!',
    });
  };

  const handleBack = () => {
    previousStep();
  };

  return (
    <>
      <HighlightOverlay 
        highlightTarget={highlightedElement}
        active={state.active}
      />
      
      <Dialog open={state.active} onOpenChange={() => {
        // Prevent closing during onboarding - user must complete or skip
      }}>
        {/* Custom DialogContent without overlay - we use HighlightOverlay instead */}
        <DialogPrimitive.Portal>
          {/* No DialogOverlay here - HighlightOverlay handles the darkening */}
          <DialogPrimitive.Content
            onInteractOutside={(e) => {
              // Prevent closing when clicking outside the modal
              e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              // Prevent closing with Escape key during onboarding
              e.preventDefault();
            }}
            className={cn(
              "fixed z-[9999] grid w-full gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out rounded-lg",
              // Mobile: Slide up from bottom, minimal space
              "max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:rounded-t-2xl max-md:rounded-b-none max-md:p-4 max-md:pb-safe max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=open]:slide-in-from-bottom",
              // Desktop: Various positions based on step
              "md:w-auto",
              // Step 3 (index 2) and Step 4 (index 3) - bottom left, wider but shorter (desktop only)
              state.step === 2 || state.step === 3
                ? "md:left-4 md:bottom-4 md:max-w-2xl md:w-[600px] md:p-4 md:translate-x-0 md:translate-y-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-bottom-0"
                // Step 5 (index 4) - middle right (desktop only)
                : state.step === 4
                ? "md:right-4 md:top-[50%] md:max-w-2xl md:w-[500px] md:p-6 md:translate-x-0 md:translate-y-[-50%] data-[state=closed]:slide-out-to-right-0 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-right-0 data-[state=open]:slide-in-from-top-[48%]"
                // Step 6 (index 5) - lower center (desktop only)
                : state.step === 5
                ? "md:left-[50%] md:top-[65%] md:max-w-2xl md:w-[600px] md:p-6 md:translate-x-[-50%] md:translate-y-[-50%] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[63%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[63%]"
                // Step 9 (index 8) - lower center (desktop only)
                : state.step === 8
                ? "md:left-[50%] md:top-[65%] md:max-w-2xl md:w-[600px] md:p-6 md:translate-x-[-50%] md:translate-y-[-50%] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[63%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[63%]"
                // Default - center (desktop only)
                : "md:left-[50%] md:top-[50%] md:max-w-2xl md:p-6 md:translate-x-[-50%] md:translate-y-[-50%] data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
            )}
          >
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold max-md:text-2xl">{step.title}</DialogTitle>
            {step.description && (
              <DialogDescription className="mt-3 text-lg max-md:mt-2 max-md:text-base">
                {step.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-6 max-md:mt-3 max-md:space-y-2">
            {step.content && (
              <div className="prose prose-sm max-w-none">
                {typeof step.content === 'string' ? (
                  <p className="text-muted-foreground whitespace-pre-line text-lg leading-relaxed max-md:text-base max-md:leading-snug">{step.content}</p>
                ) : (
                  step.content
                )}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-6 max-md:mt-4">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors max-md:h-1.5 ${
                  index <= state.step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 max-md:mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleSkipAll}
                className="text-muted-foreground text-base max-md:text-sm max-md:h-9"
              >
                Skip All
              </Button>
              
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 text-base max-md:text-sm max-md:h-9"
                >
                  <ChevronRight className="h-5 w-5 rotate-180 max-md:h-4 max-md:w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 max-md:gap-2">
              {!isMobile && (
                <span className="text-base text-muted-foreground font-medium">
                  {state.step + 1} / {onboardingSteps.length}
                </span>
              )}
              <Button onClick={handleNext} className="gap-2 text-base max-md:text-sm max-md:h-9">
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ChevronRight className="h-5 w-5 max-md:h-4 max-md:w-4" />}
              </Button>
            </div>
          </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </Dialog>
    </>
  );
}
