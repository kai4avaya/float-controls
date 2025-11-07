export interface ControlButton {
  label?: string;
  icon?: string;
  action: () => void;
  className?: string;
}

export interface ControlPanelConfig {
  width?: string; // e.g., '91.666667%' or '90%'
  padding?: string; // e.g., '1rem' or '16px'
  borderRadius?: string; // e.g., '1rem' or '16px'
  backgroundColor?: string; // e.g., 'rgba(255, 255, 255, 0.1)'
  backdropBlur?: string; // e.g., '12px'
  borderColor?: string; // e.g., 'rgba(255, 255, 255, 0.2)'
  transitionDuration?: string; // e.g., '0.5s'
  slideUpOffset?: string; // e.g., '-1rem' or '-16px'
  hideDelay?: number; // Delay in milliseconds before hiding after mouse stops moving (default: 1500ms)
  buttons?: ControlButton[];
}

export class ControlPanelOverlay extends HTMLElement {
  private _label: string = 'Controls';
  private _subtitle: string = '';
  private _config: ControlPanelConfig = {};
  private isVisible: boolean = false;
  private hostElement: HTMLElement | null = null;
  private panelBase: HTMLElement | null = null;
  private hideTimeout: number | null = null;
  private isMouseInside: boolean = false;

  static get observedAttributes() {
    return ['label', 'subtitle'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.setupStyles();
  }

  // Property getters and setters
  get label(): string {
    return this._label;
  }

  set label(value: string) {
    if (this._label !== value) {
      this._label = value;
      this.setAttribute('label', value);
      this.updateRender();
    }
  }

  get subtitle(): string {
    return this._subtitle;
  }

  set subtitle(value: string) {
    if (this._subtitle !== value) {
      this._subtitle = value;
      this.setAttribute('subtitle', value);
      this.updateRender();
    }
  }

  get config(): ControlPanelConfig {
    return this._config;
  }

  set config(value: ControlPanelConfig) {
    this._config = value;
    this.updateRender();
  }

  // Attribute change handling
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'label':
        this._label = newValue || 'Controls';
        this.updateRender();
        break;
      case 'subtitle':
        this._subtitle = newValue || '';
        this.updateRender();
        break;
    }
  }

  // Setup styles in shadow DOM
  private setupStyles() {
    if (!this.shadowRoot) return;
    const style = document.createElement('style');
    style.textContent = `
      :host {
        /* CRITICAL: Ensures the custom element tag doesn't introduce layout issues */
        display: contents;
        /* Always allow clicks to pass through the host element */
        pointer-events: none;
      }

      :host(.panel-host-visible) {
        /* Keep pointer-events: none even when visible - clicks should pass through */
        pointer-events: none;
      }

      /* Glass panel visual styling */
      .glass-panel {
        background: rgba(255, 255, 255, 0.1);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        color: white;
      }

      /* Base layout for the panel */
      .panel-base {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 91.666667%;
        padding: 1rem;
        border-radius: 1rem;
        
        /* Hidden state: Off-screen below center */
        transform: translate(-50%, 100%); 
        transition: transform var(--transition-duration, 0.5s) ease-out, opacity var(--transition-duration, 0.5s) ease;
        opacity: 0;
        
        /* Prevents interaction when hidden - ensure ALL descendants also respect this */
        pointer-events: none !important; 
        z-index: 100;
      }

      /* When hidden, ensure ALL children also ignore pointer events */
      .panel-base * {
        pointer-events: none !important;
      }

      /* Visible state - override pointer-events for the panel */
      .panel-base.panel-visible {
        transform: translate(-50%, var(--slide-up-offset, -1rem)); 
        opacity: 1;
        pointer-events: auto !important;
      }

      /* When visible, re-enable pointer events - this must have higher specificity */
      .panel-base.panel-visible * {
        pointer-events: auto !important;
      }

      /* Ensure buttons are always clickable when panel is visible */
      .panel-base.panel-visible .control-button {
        pointer-events: auto !important;
        cursor: pointer;
      }

      /* Button styles */
      .control-button {
        background: rgba(255, 255, 255, 0.2);
        box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.2),
                    inset -2px -2px 4px rgba(0, 0, 0, 0.1),
                    4px 4px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .control-button:active {
        box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.2),
                    inset -2px -2px 4px rgba(255, 255, 255, 0.2);
        transform: translateY(1px) translateX(1px);
      }

      .button-round {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
      }

      .button-icon {
        width: 1.25rem;
        height: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .button-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .panel-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .panel-text {
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .panel-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin: 0 0 0.25rem 0;
      }

      .panel-subtitle {
        font-size: 0.875rem;
        opacity: 0.9;
        margin: 0;
      }

      .button-group {
        display: flex;
        gap: 0.75rem;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  // Computed styles based on config
  private getPanelStyleString(): string {
    const {
      width = '91.666667%',
      padding = '1rem',
      borderRadius = '1rem',
      backgroundColor = 'rgba(255, 255, 255, 0.1)',
      backdropBlur = '12px',
      borderColor = 'rgba(255, 255, 255, 0.2)',
      transitionDuration = '0.5s',
      slideUpOffset = '-1rem'
    } = this.config;

    let style = `width: ${width}; padding: ${padding}; border-radius: ${borderRadius}; `;
    style += `background: ${backgroundColor}; `;
    style += `-webkit-backdrop-filter: blur(${backdropBlur}); `;
    style += `backdrop-filter: blur(${backdropBlur}); `;
    style += `border-color: ${borderColor}; `;
    style += `--transition-duration: ${transitionDuration}; `;
    style += `--slide-up-offset: ${slideUpOffset};`;

    // Note: transform and opacity are controlled by CSS class .panel-visible
    // We use CSS custom properties for transition duration and slide offset

    return style;
  }

  // --- Lifecycle: Setup and Teardown ---

  connectedCallback() {
    // Get the immediate parent element (DOM property)
    const host = this.parentElement;

    if (host instanceof HTMLElement) {
      this.hostElement = host; 
      
      // Inject class for required positioning (position: relative)
      this.hostElement.classList.add('control-panel-host');
      
      // Ensure parent has position relative if not already set
      const computedStyle = window.getComputedStyle(this.hostElement);
      if (computedStyle.position === 'static') {
        this.hostElement.style.position = 'relative';
      }

      this.addHostEventListeners(this.hostElement);
    } else {
      console.warn("ControlPanelOverlay must be placed inside a container element.");
    }

    // Initialize from attributes
    if (this.hasAttribute('label')) {
      this._label = this.getAttribute('label') || 'Controls';
    }
    if (this.hasAttribute('subtitle')) {
      this._subtitle = this.getAttribute('subtitle') || '';
    }

    this.updateRender();
  }
    
  disconnectedCallback() {
    // Clear any pending timeout
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.hostElement) {
      this.removeHostEventListeners(this.hostElement);
      
      // Remove the injected class upon cleanup
      this.hostElement.classList.remove('control-panel-host'); 
      this.hostElement.classList.remove('control-panel-active'); 
    }
  }

  // --- Event Handling ---

  private addHostEventListeners(host: HTMLElement) {
    host.addEventListener('mouseenter', this.handleMouseEnter);
    host.addEventListener('mouseleave', this.handleMouseLeave);
    host.addEventListener('mousemove', this.handleMouseMove);
    // Also listen on the panel itself to keep it visible when hovering over it
    this.addEventListener('mouseenter', this.handlePanelMouseEnter);
    this.addEventListener('mouseleave', this.handlePanelMouseLeave);
    this.addEventListener('mousemove', this.handleMouseMove);
  }

  private removeHostEventListeners(host: HTMLElement) {
    host.removeEventListener('mouseenter', this.handleMouseEnter);
    host.removeEventListener('mouseleave', this.handleMouseLeave);
    host.removeEventListener('mousemove', this.handleMouseMove);
    this.removeEventListener('mouseenter', this.handlePanelMouseEnter);
    this.removeEventListener('mouseleave', this.handlePanelMouseLeave);
    this.removeEventListener('mousemove', this.handleMouseMove);
  }

  private handleMouseEnter = () => {
    this.isMouseInside = true;
    this.showPanel();
  }

  private handleMouseLeave = (e: MouseEvent) => {
    // Check if mouse is moving to the panel
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && this.contains(relatedTarget)) {
      // Mouse is moving from host to panel - keep visible
      return;
    }
    // Mouse is truly leaving - slide down
    this.isMouseInside = false;
    this.hidePanelWithSlide();
  }

  private handlePanelMouseEnter = () => {
    // When mouse enters the panel itself, keep it visible
    // Don't change isMouseInside here - it's already true from host
    this.showPanel();
  }

  private handlePanelMouseLeave = (e: MouseEvent) => {
    // When mouse leaves the panel, check if we're entering the host
    // Use relatedTarget to see where the mouse is going
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && this.hostElement && this.hostElement.contains(relatedTarget)) {
      // Mouse is moving from panel to host - keep visible
      return;
    }
    // Mouse is leaving both panel and host - slide down
    this.isMouseInside = false;
    this.hidePanelWithSlide();
  }

  private handleMouseMove = () => {
    // On ANY mouse movement, show the panel (slide up)
    if (this.isMouseInside) {
      this.showPanel();
    }
  }

  private showPanel() {
    // Clear any pending hide timeout
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Show with slide-up animation if not already visible
    if (!this.isVisible) {
      this.isVisible = true;
      this.hostElement?.classList.add('control-panel-active');
      this.classList.add("panel-host-visible");
      this.updatePanelVisibility();
    }

    // Set timeout to hide after delay if mouse stops moving
    const delay = this.config.hideDelay || 1500; // Default 1.5 seconds
    this.hideTimeout = window.setTimeout(() => {
      // Only hide if mouse is still inside (user stopped moving)
      if (this.isMouseInside) {
        this.hidePanelWithSlide();
      }
      this.hideTimeout = null;
    }, delay);
  }

  private hidePanelWithSlide() {
    // Clear any pending timeout
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Hide with slide-down animation
    this.isVisible = false;
    this.hostElement?.classList.remove('control-panel-active');
    this.classList.remove("panel-host-visible");
    this.updatePanelVisibility();
  }


  private updatePanelVisibility() {
    // Update visibility class without recreating the panel
    if (this.panelBase) {
      if (this.isVisible) {
        this.panelBase.classList.add('panel-visible');
      } else {
        this.panelBase.classList.remove('panel-visible');
      }
    }
  }

  private handleButtonClick(button: ControlButton) {
    button.action();
  }

  // --- Render Method ---

  private updateRender() {
    if (!this.shadowRoot) return;

    // Create panel if it doesn't exist, otherwise update content
    if (!this.panelBase) {
      this.createPanel();
    } else {
      this.updatePanelContent();
    }

    // Update visibility state
    this.updatePanelVisibility();
  }

  private createPanel() {
    if (!this.shadowRoot) return;

    // Create panel base
    const panelBase = document.createElement('div');
    panelBase.className = 'panel-base glass-panel';
    panelBase.style.cssText = this.getPanelStyleString();
    this.panelBase = panelBase;

    // Create panel content container
    const panelContent = document.createElement('div');
    panelContent.className = 'panel-content';
    panelBase.appendChild(panelContent);

    // Add slot for user content
    const slot = document.createElement('slot');
    panelBase.appendChild(slot);

    // Append to shadow root
    this.shadowRoot.appendChild(panelBase);

    // Populate initial content
    this.updatePanelContent();
  }

  private updatePanelContent() {
    if (!this.panelBase || !this.shadowRoot) return;

    // Update styles from config
    this.panelBase.style.cssText = this.getPanelStyleString();

    // Find or create content container
    let panelContent = this.panelBase.querySelector('.panel-content') as HTMLElement;
    if (!panelContent) {
      panelContent = document.createElement('div');
      panelContent.className = 'panel-content';
      // Insert before slot
      const slot = this.panelBase.querySelector('slot');
      if (slot) {
        this.panelBase.insertBefore(panelContent, slot);
      } else {
        this.panelBase.appendChild(panelContent);
      }
    }

    // Clear existing content
    panelContent.innerHTML = '';

    const buttons = this.config.buttons || [];

    // Add text content if label or subtitle exists
    if (this.label || this.subtitle) {
      const panelText = document.createElement('div');
      panelText.className = 'panel-text';

      if (this.label) {
        const title = document.createElement('h3');
        title.className = 'panel-title';
        title.textContent = this.label;
        panelText.appendChild(title);
      }

      if (this.subtitle) {
        const subtitle = document.createElement('p');
        subtitle.className = 'panel-subtitle';
        subtitle.textContent = this.subtitle;
        panelText.appendChild(subtitle);
      }

      panelContent.appendChild(panelText);
    }

    // Add buttons if they exist
    if (buttons.length > 0) {
      const buttonGroup = document.createElement('div');
      buttonGroup.className = 'button-group';

      buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.className = `control-button button-round ${button.className || ''}`;
        buttonElement.title = button.label || '';
        buttonElement.addEventListener('click', () => this.handleButtonClick(button));

        if (button.icon) {
          const iconSpan = document.createElement('span');
          iconSpan.className = 'button-icon';
          iconSpan.innerHTML = button.icon; // Safe since we control the input
          buttonElement.appendChild(iconSpan);
        } else if (button.label) {
          buttonElement.textContent = button.label;
        }

        buttonGroup.appendChild(buttonElement);
      });

      panelContent.appendChild(buttonGroup);
    }
  }
}

// Register the custom element
if (!customElements.get('control-panel-overlay')) {
  customElements.define('control-panel-overlay', ControlPanelOverlay);
}
