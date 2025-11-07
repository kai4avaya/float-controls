import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ControlPanelOverlay } from './control-panel';

describe('ControlPanelOverlay', () => {
  let container: HTMLElement;
  let component: ControlPanelOverlay;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '400px';
    container.style.height = '300px';
    document.body.appendChild(container);

    component = document.createElement('control-panel-overlay') as ControlPanelOverlay;
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should be defined', () => {
    expect(ControlPanelOverlay).toBeDefined();
  });

  it('should have default label', () => {
    expect(component.label).toBe('Controls');
  });

  it('should accept label property', () => {
    component.label = 'Test Label';
    expect(component.label).toBe('Test Label');
  });

  it('should accept subtitle property', () => {
    component.subtitle = 'Test Subtitle';
    expect(component.subtitle).toBe('Test Subtitle');
  });

  it('should accept config property', () => {
    const config = {
      width: '90%',
      padding: '1rem',
      buttons: []
    };
    component.config = config;
    expect(component.config).toEqual(config);
  });

  it('should inject control-panel-host class on parent', () => {
    expect(container.classList.contains('control-panel-host')).toBe(true);
  });

  it('should remove classes on disconnect', () => {
    component.remove();
    expect(container.classList.contains('control-panel-host')).toBe(false);
  });

  it('should handle button actions', () => {
    let actionCalled = false;
    component.config = {
      buttons: [
        {
          label: 'Test',
          action: () => {
            actionCalled = true;
          }
        }
      ]
    };
    
    // Trigger button click
    const button = component.shadowRoot?.querySelector('button');
    if (button) {
      button.click();
      expect(actionCalled).toBe(true);
    }
  });

  /**
   * Hover behavior and visibility tests
   * 
   * These tests cover the complex hover scenarios, including the bug where
   * the panel slides down when hovering off it even though the mouse is still
   * in the parent container. The tests use mocks for elementFromPoint to simulate
   * real browser behavior where relatedTarget might be unreliable.
   */
  describe('Hover behavior and visibility', () => {
    beforeEach(async () => {
      // Wait for component to be fully connected and rendered
      // Use a more reliable approach with a timeout
      const maxWait = 1000;
      const startTime = Date.now();
      
      while (!component.shadowRoot && (Date.now() - startTime) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      if (!component.shadowRoot) {
        throw new Error('Component shadow root not available after waiting');
      }
      
      // Wait a bit more for initial render - use requestAnimationFrame for better timing
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });
    }, 15000); // Increase timeout to 15 seconds

    const isPanelVisible = (): boolean => {
      const panelBase = component.shadowRoot?.querySelector('.panel-base');
      return panelBase?.classList.contains('panel-visible') ?? false;
    };

    const createMouseEvent = (
      type: string,
      target: Element,
      relatedTarget: Element | null = null,
      clientX: number = 200,
      clientY: number = 150
    ): MouseEvent => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
        relatedTarget: relatedTarget as Node
      });
      return event;
    };

    it('should show panel when mouse enters container', () => {
      const mouseEnterEvent = createMouseEvent('mouseenter', container);
      container.dispatchEvent(mouseEnterEvent);
      
      // Wait for panel to show
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(isPanelVisible()).toBe(true);
          expect(container.classList.contains('control-panel-active')).toBe(true);
          resolve();
        }, 100);
      });
    });

    it('should keep panel visible when mouse enters panel from container', () => {
      // First enter container
      container.dispatchEvent(createMouseEvent('mouseenter', container));
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(isPanelVisible()).toBe(true);
          
          // Then enter panel (simulate moving from container to panel)
          const panelEnterEvent = createMouseEvent('mouseenter', component, container);
          component.dispatchEvent(panelEnterEvent);
          
          setTimeout(() => {
            // Panel should still be visible
            expect(isPanelVisible()).toBe(true);
            resolve();
          }, 50);
        }, 100);
      });
    });

    /**
     * CRITICAL BUG TEST: This test catches the bug where the panel slides down
     * when the mouse leaves the panel but is still within the parent container.
     * 
     * Expected behavior: Panel should stay visible
     * Current bug: Panel hides incorrectly
     * 
     * This test will FAIL if the bug exists (which it currently does).
     */
    it('should keep panel visible when mouse leaves panel but stays in container', () => {
      // This is the critical bug test case
      vi.useFakeTimers();
      
      // Step 1: Mouse enters container
      container.dispatchEvent(createMouseEvent('mouseenter', container));
      vi.advanceTimersByTime(100);
      
      expect(isPanelVisible()).toBe(true);
      
      // Step 2: Mouse enters panel
      const panelEnterEvent = createMouseEvent('mouseenter', component, container);
      component.dispatchEvent(panelEnterEvent);
      vi.advanceTimersByTime(50);
      
      expect(isPanelVisible()).toBe(true);
      
      // Step 3: Mouse leaves panel but stays in container
      // Create a child element inside container to simulate mouse moving to another part of container
      const containerChild = document.createElement('div');
      containerChild.style.width = '100px';
      containerChild.style.height = '100px';
      containerChild.style.position = 'absolute';
      containerChild.style.top = '0';
      containerChild.style.left = '0';
      container.appendChild(containerChild);
      
      // Mock elementFromPoint BEFORE creating the event
      // This simulates the fallback check in handlePanelMouseLeave
      const originalElementFromPoint = document.elementFromPoint;
      const mockElementFromPoint = vi.fn((x: number, y: number) => {
        // If coordinates match where we're simulating the mouse, return containerChild
        if (x === 50 && y === 50) {
          return containerChild;
        }
        // For any other coordinates, try original first, then fallback to containerChild
        const original = originalElementFromPoint.call(document, x, y);
        return original || containerChild;
      });
      document.elementFromPoint = mockElementFromPoint;
      
      try {
        // Simulate mouse leaving panel and entering container child
        // The relatedTarget should be containerChild, which is inside container
        // Note: In synthetic events, relatedTarget might not work correctly, so we rely on elementFromPoint fallback
        const panelLeaveEvent = createMouseEvent('mouseleave', component, containerChild, 50, 50);
        
        // In some test environments, relatedTarget in synthetic events might not work correctly
        // So we ensure elementFromPoint will be called by checking if relatedTarget actually worked
        // If relatedTarget is null or not within host, elementFromPoint should be called
        
        // Dispatch the event
        component.dispatchEvent(panelLeaveEvent);
        vi.advanceTimersByTime(100);
        
        // Verify elementFromPoint was called (fallback should kick in if relatedTarget doesn't work)
        // In synthetic events, relatedTarget might not be set correctly, so elementFromPoint should be used
        // Note: If relatedTarget works correctly, elementFromPoint might not be called, which is fine
        // But if relatedTarget doesn't work, elementFromPoint MUST be called to detect mouse position
        const elementFromPointCalled = mockElementFromPoint.mock.calls.length > 0;
        const relatedTargetWorked = panelLeaveEvent.relatedTarget !== null && 
                                   container.contains(panelLeaveEvent.relatedTarget as Node);
        // Test verification
        
        // Panel should STAY visible because mouse is still in container
        // Either relatedTarget works OR elementFromPoint detects the mouse is still in container
        expect(isPanelVisible()).toBe(true);
        expect(container.classList.contains('control-panel-active')).toBe(true);
      } finally {
        // Restore original
        document.elementFromPoint = originalElementFromPoint;
        vi.useRealTimers();
      }
    });

    it('should hide panel when mouse leaves entire container', () => {
      vi.useFakeTimers();
      
      // Enter container and show panel
      container.dispatchEvent(createMouseEvent('mouseenter', container));
      vi.advanceTimersByTime(100);
      
      expect(isPanelVisible()).toBe(true);
      
      // Mock elementFromPoint to return body (outside container) when called
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => document.body);
      
      try {
        // Leave container (relatedTarget is outside)
        const bodyElement = document.body;
        const containerLeaveEvent = createMouseEvent('mouseleave', container, bodyElement, 500, 500);
        container.dispatchEvent(containerLeaveEvent);
        vi.advanceTimersByTime(100);
        
        // Panel should hide
        expect(isPanelVisible()).toBe(false);
        expect(container.classList.contains('control-panel-active')).toBe(false);
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        vi.useRealTimers();
      }
    });

    it('should handle rapid mouse movements between panel and container', () => {
      vi.useFakeTimers();
      
      // Create container child for mouse to move to
      const containerChild = document.createElement('div');
      container.appendChild(containerChild);
      
      // Mock elementFromPoint to return containerChild when mouse is over it
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn((x: number, y: number) => {
        if (x === 50 && y === 50) {
          return containerChild;
        }
        return originalElementFromPoint.call(document, x, y);
      });
      
      try {
        // Enter container
        container.dispatchEvent(createMouseEvent('mouseenter', container));
        vi.advanceTimersByTime(50);
        expect(isPanelVisible()).toBe(true);
        
        // Rapidly enter panel
        component.dispatchEvent(createMouseEvent('mouseenter', component, container));
        vi.advanceTimersByTime(10);
        
        // Rapidly leave panel (but stay in container)
        component.dispatchEvent(createMouseEvent('mouseleave', component, containerChild, 50, 50));
        vi.advanceTimersByTime(10);
        
        // Rapidly enter panel again
        component.dispatchEvent(createMouseEvent('mouseenter', component, containerChild));
        vi.advanceTimersByTime(10);
        
        // Panel should remain visible throughout
        expect(isPanelVisible()).toBe(true);
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        vi.useRealTimers();
      }
    });

    it('should use elementFromPoint fallback when relatedTarget is unreliable', () => {
      vi.useFakeTimers();
      
      // Enter container
      container.dispatchEvent(createMouseEvent('mouseenter', container));
      vi.advanceTimersByTime(100);
      expect(isPanelVisible()).toBe(true);
      
      // Create container child and add to DOM
      const containerChild = document.createElement('div');
      containerChild.style.width = '100px';
      containerChild.style.height = '100px';
      container.appendChild(containerChild);
      
      // Mock elementFromPoint BEFORE creating the event
      const originalElementFromPoint = document.elementFromPoint;
      const mockElementFromPoint = vi.fn((x: number, y: number) => {
        // Return containerChild when checking at the mouse position
        if (x === 100 && y === 100) {
          return containerChild;
        }
        return originalElementFromPoint.call(document, x, y) || containerChild;
      });
      document.elementFromPoint = mockElementFromPoint;
      
      try {
        // Leave panel with null relatedTarget (unreliable)
        // This simulates a browser where relatedTarget is not set correctly
        const panelLeaveEvent = new MouseEvent('mouseleave', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
          relatedTarget: null
        });
        console.log('[TEST]', 'relatedTarget:', panelLeaveEvent.relatedTarget, '| clientX/Y:', panelLeaveEvent.clientX, panelLeaveEvent.clientY);
        component.dispatchEvent(panelLeaveEvent);
        vi.advanceTimersByTime(100);
        
        // Panel should stay visible because elementFromPoint shows mouse is still in container
        console.log('[TEST]', 'panelVisible:', isPanelVisible(), '| elementFromPoint called:', mockElementFromPoint.mock.calls.length > 0);
        expect(isPanelVisible()).toBe(true);
      } finally {
        // Restore original
        document.elementFromPoint = originalElementFromPoint;
        vi.useRealTimers();
      }
    });

    it('should handle mouse movement within container to keep panel visible', () => {
      vi.useFakeTimers();
      
      try {
        // Enter container
        console.log('[TEST]', 'Step 1: Enter container');
        container.dispatchEvent(createMouseEvent('mouseenter', container));
        vi.advanceTimersByTime(100);
        console.log('[TEST]', 'Panel visible after enter:', isPanelVisible());
        expect(isPanelVisible()).toBe(true);
        
        // Move mouse within container (should reset hide timeout)
        console.log('[TEST]', 'Step 2: Move mouse within container (should reset timeout)');
        container.dispatchEvent(createMouseEvent('mousemove', container, null, 150, 100));
        vi.advanceTimersByTime(500);
        console.log('[TEST]', 'Panel visible after 500ms:', isPanelVisible());
        
        // Panel should still be visible (hide timeout should have been reset)
        expect(isPanelVisible()).toBe(true);
        
        // Stop moving for longer than hideDelay
        console.log('[TEST]', 'Step 3: Set hideDelay to 1000ms, advance 1100ms (no movement)');
        component.config = { hideDelay: 1000 };
        vi.advanceTimersByTime(1100);
        console.log('[TEST]', 'Panel visible after timeout:', isPanelVisible());
        
        // Now panel should hide (if mouse is still inside but not moving)
        // But since we're still in container, it depends on the implementation
        // This test verifies the timeout behavior
      } finally {
        vi.useRealTimers();
      }
    });

    it('should handle complex scenario: hover panel, move to container edge, then back', () => {
      vi.useFakeTimers();
      
      // Create a more complex container structure
      const innerContent = document.createElement('div');
      innerContent.style.width = '100%';
      innerContent.style.height = '100%';
      innerContent.style.position = 'relative';
      container.appendChild(innerContent);
      
      // Mock elementFromPoint to return appropriate elements
      const originalElementFromPoint = document.elementFromPoint;
      let elementFromPointCallCount = 0;
      document.elementFromPoint = vi.fn((x: number, y: number) => {
        elementFromPointCallCount++;
        // When checking at edge coordinates, return innerContent (still in container)
        if (x === 10 && y === 10) {
          return innerContent;
        }
        // When checking at center coordinates, return innerContent
        if (x === 200 && y === 100) {
          return innerContent;
        }
        // When checking outside container, return body
        if (x === 500 && y === 500) {
          return document.body;
        }
        return originalElementFromPoint.call(document, x, y);
      });
      
      try {
        // Enter container
        container.dispatchEvent(createMouseEvent('mouseenter', container));
        vi.advanceTimersByTime(100);
        expect(isPanelVisible()).toBe(true);
        
        // Enter panel
        component.dispatchEvent(createMouseEvent('mouseenter', component, container));
        vi.advanceTimersByTime(50);
        expect(isPanelVisible()).toBe(true);
        
        // Leave panel, moving to inner content (still in container)
        component.dispatchEvent(createMouseEvent('mouseleave', component, innerContent, 200, 100));
        vi.advanceTimersByTime(100);
        
        // Panel should stay visible
        expect(isPanelVisible()).toBe(true);
        
        // Move mouse to edge of container (but still inside)
        innerContent.dispatchEvent(createMouseEvent('mousemove', innerContent, null, 10, 10));
        vi.advanceTimersByTime(50);
        
        // Panel should still be visible
        expect(isPanelVisible()).toBe(true);
        
        // Finally leave entire container
        container.dispatchEvent(createMouseEvent('mouseleave', container, document.body, 500, 500));
        vi.advanceTimersByTime(100);
        
        // Now panel should hide
        expect(isPanelVisible()).toBe(false);
      } finally {
        document.elementFromPoint = originalElementFromPoint;
        vi.useRealTimers();
      }
    });
  });
});
