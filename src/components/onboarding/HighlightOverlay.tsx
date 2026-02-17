import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface HighlightOverlayProps {
  highlightTarget: string | null;
  active: boolean;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function HighlightOverlay({ highlightTarget, active }: HighlightOverlayProps) {
  const [highlightRects, setHighlightRects] = useState<HighlightRect[]>([]);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const mutationDebounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!active) {
      setHighlightRects([]);
      setOverlayVisible(false);
      return;
    }

    // If no highlight target, show full overlay (for welcome screen)
    if (!highlightTarget) {
      setHighlightRects([]);
      setOverlayVisible(true); // Show overlay even without highlights
      return;
    }

    let retryCount = 0;
    const maxRetries = 40; // Try for up to 4 seconds with faster checks (important for mobile drawer animations)

    const updateHighlight = () => {
      // Support multiple targets separated by commas
      const targets = highlightTarget.split(',').map(t => t.trim());
      const elements: Element[] = [];
      
      for (const target of targets) {
        const element = document.querySelector(`[data-onboarding-highlight="${target}"]`);
        if (element) {
          elements.push(element);
        }
      }
      
      if (elements.length > 0) {
        // Calculate separate rectangles for each element
        const rects: HighlightRect[] = [];
        let allHaveDimensions = true;
        
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          // Element must be visible and have dimensions
          if (rect.width > 0 && rect.height > 0 && rect.left >= 0) {
            rects.push({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            });
          } else {
            allHaveDimensions = false;
            break;
          }
        }
        
        if (allHaveDimensions && rects.length > 0) {
          setHighlightRects(rects);
          setOverlayVisible(true);
          retryCount = 0; // Reset retry count on success
        } else if (retryCount < maxRetries) {
          // Elements exist but don't have dimensions yet or are off-screen, retry
          retryCount++;
          clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = setTimeout(() => {
            updateHighlight();
          }, 100);
        }
      } else if (retryCount < maxRetries) {
        // Elements not found, retry after a short delay
        retryCount++;
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => {
          updateHighlight();
        }, 100);
      } else {
        // Give up after max retries
        console.warn(`Onboarding highlight target(s) not found: ${highlightTarget}`);
        setHighlightRects([]);
        setOverlayVisible(false);
      }
    };

    // Initial update with delay to allow for animations (like mobile drawer opening)
    // Mobile drawer: opens immediately + 500ms animation = ~500ms total
    const initialDelay = setTimeout(() => {
      updateHighlight();
    }, 300); // 300ms initial delay, then fast retries for drawer animation

    // Update on scroll and resize
    const handleUpdate = () => {
      updateHighlight();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    // Watch for DOM changes (e.g., mobile drawer opening) with debouncing
    const observer = new MutationObserver(() => {
      clearTimeout(mutationDebounceRef.current);
      mutationDebounceRef.current = setTimeout(() => {
        updateHighlight();
      }, 50); // Debounce mutations by 50ms for faster response
    });
    
    // Observe body for added nodes (like Sheet portals)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(updateTimeoutRef.current);
      clearTimeout(mutationDebounceRef.current);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      observer.disconnect();
    };
  }, [highlightTarget, active]);

  // Inject pulse animation if not already present (must be before early return)
  useEffect(() => {
    const styleId = 'onboarding-highlight-animation';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1), 0 0 30px hsl(var(--primary) / 0.6);
          }
          50% {
            opacity: 0.9;
            box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1), 0 0 40px hsl(var(--primary) / 0.8);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!overlayVisible) {
    return null;
  }

  // Generate unique mask ID based on highlight targets to avoid conflicts
  const maskId = `highlight-mask-${highlightTarget ? highlightTarget.replace(/[^a-zA-Z0-9]/g, '-') : 'default'}`;

  // If no highlight rects, show simple full-screen overlay (for welcome screen)
  if (highlightRects.length === 0) {
    const simpleOverlayContent = (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          pointerEvents: 'none',
        }}
      />
    );
    return createPortal(simpleOverlayContent, document.body);
  }

  const overlayContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
      }}
    >
      {/* Dark overlay with holes for each highlight */}
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {highlightRects.map((rect, index) => (
              <rect
                key={index}
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                fill="black"
                rx="8"
              />
            ))}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.35)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Highlight borders for each rectangle */}
      {highlightRects.map((rect, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            border: '3px solid hsl(var(--primary))',
            borderRadius: '12px',
            boxShadow: '0 0 0 4px rgba(0, 0, 0, 0.1), 0 0 30px hsl(var(--primary) / 0.6)',
            pointerEvents: 'none',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );

  return createPortal(overlayContent, document.body);
}
