import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
});
