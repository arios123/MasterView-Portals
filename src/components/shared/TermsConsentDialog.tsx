import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { loadTermsContent } from '@/utils/termsUtils';

interface TermsConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  termsVersion?: string;
}

export function TermsConsentDialog({
  open,
  onOpenChange,
  onAccept,
  termsVersion = 'v1',
}: TermsConsentDialogProps) {
  const [termsContent, setTermsContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Load terms content when dialog opens
  useEffect(() => {
    if (open && !termsContent) {
      setLoading(true);
      loadTermsContent()
        .then((content) => {
          setTermsContent(content || 'Terms and conditions content could not be loaded.');
          setLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load terms:', error);
          setTermsContent('Terms and conditions content could not be loaded. Please contact support.');
          setLoading(false);
        });
    }
  }, [open, termsContent]);

  // Reset scroll state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setHasScrolledToBottom(false);
    }
  }, [open]);


  // Check if content fits without scrolling or if scrolled to bottom
  const checkScrollPosition = (element: HTMLDivElement) => {
    // If content fits in viewport (no scroll needed), consider it "scrolled to bottom"
    const noScrollNeeded = element.scrollHeight <= element.clientHeight;
    // Or if scrolled to bottom
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10; // 10px threshold
    
    setHasScrolledToBottom(noScrollNeeded || isAtBottom);
  };

  // Handle scroll detection
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    checkScrollPosition(event.currentTarget);
  };

  // Check initial scroll position when content loads
  useEffect(() => {
    if (termsContent && scrollViewportRef.current && !loading) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (scrollViewportRef.current) {
          checkScrollPosition(scrollViewportRef.current);
        }
      }, 100);
    }
  }, [termsContent, loading]);

  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
    // Reset state for next time
    setHasScrolledToBottom(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept the terms and conditions to continue.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollViewportRef}
          onScroll={handleScroll}
          className="flex-1 min-h-[300px] max-h-[400px] border rounded-md overflow-y-auto"
        >
          <div className="p-4 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading terms and conditions...</p>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-sm leading-relaxed mb-6">
                  {termsContent || 'Terms and conditions content is loading...'}
                </div>
                
                {/* Agree button at bottom of scrollable content */}
                <div className="border-t pt-4 pb-2 space-y-3 bg-white">
                  <Button
                    onClick={handleAccept}
                    disabled={!hasScrolledToBottom || loading}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    I Agree to the Terms and Conditions
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hint label outside scrollable area at bottom of modal */}
        <div className="text-xs text-muted-foreground text-center pt-2 pb-1">
          {hasScrolledToBottom
            ? '✓ You have read the terms and conditions'
            : 'Please scroll to the bottom to continue'}
        </div>
      </DialogContent>
    </Dialog>
  );
}

