import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

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
  buttons?: ControlButton[];
}

@customElement('control-panel-overlay')
export class ControlPanelOverlay extends LitElement {

  static styles = css`
    :host {
      /* CRITICAL: Ensures the custom element tag doesn't introduce layout issues */
      display: contents; 
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
      transition: transform 0.5s ease-out, opacity 0.5s ease;
      opacity: 0;
      
      /* Prevents interaction when hidden */
      pointer-events: none; 
      z-index: 100;
    }

    /* Visible state */
    .panel-visible {
      transform: translate(-50%, -1rem); 
      opacity: 1;
      pointer-events: auto;
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

  @property({ type: String })
  label: string = 'Controls';

  @property({ type: String })
  subtitle: string = '';

  @property({ type: Object })
  config: ControlPanelConfig = {};

  @state()
  private isVisible: boolean = false;

  // Stores the reference to the parent element for event handling and class injection
  private hostElement: HTMLElement | null = null;

  // Computed styles based on config
  private get panelStyleString(): string {
    const {
      width = '91.666667%',
      padding = '1rem',
      borderRadius = '1rem',
      backgroundColor = 'rgba(255, 255, 255, 0.1)',
      backdropBlur = '12px',
      borderColor = 'rgba(255, 255, 255, 0.2)',
      transitionDuration = '0.5s'
    } = this.config;

    let style = `width: ${width}; padding: ${padding}; border-radius: ${borderRadius}; `;
    style += `background: ${backgroundColor}; `;
    style += `-webkit-backdrop-filter: blur(${backdropBlur}); `;
    style += `backdrop-filter: blur(${backdropBlur}); `;
    style += `border-color: ${borderColor}; `;
    style += `transition-duration: ${transitionDuration};`;

    if (this.isVisible) {
      const offset = this.config.slideUpOffset || '-1rem';
      style += ` transform: translate(-50%, ${offset}); opacity: 1; pointer-events: auto;`;
    }

    return style;
  }

  // --- Lifecycle: Setup and Teardown ---

  connectedCallback() {
    super.connectedCallback();
    
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
  }
    
  disconnectedCallback() {
    super.disconnectedCallback();
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
  }

  private removeHostEventListeners(host: HTMLElement) {
    host.removeEventListener('mouseenter', this.handleMouseEnter);
    host.removeEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseEnter = () => {
    this.isVisible = true;
    // Inject class for the consuming app to style the parent
    this.hostElement?.classList.add('control-panel-active'); 
  }

  private handleMouseLeave = () => {
    this.isVisible = false;
    this.hostElement?.classList.remove('control-panel-active'); 
  }

  private handleButtonClick(button: ControlButton) {
    button.action();
  }

  // --- Render Method ---

  render() {
    const buttons = this.config.buttons || [];
    
    return html`
      <div 
        class="panel-base glass-panel ${this.isVisible ? 'panel-visible' : ''}"
        style="${this.panelStyleString}"
      >
        <div class="panel-content">
          ${this.label || this.subtitle ? html`
            <div class="panel-text">
              ${this.label ? html`<h3 class="panel-title">${this.label}</h3>` : ''}
              ${this.subtitle ? html`<p class="panel-subtitle">${this.subtitle}</p>` : ''}
            </div>
          ` : ''}
          
          ${buttons.length > 0 ? html`
            <div class="button-group">
              ${buttons.map(button => html`
                <button 
                  class="control-button button-round ${button.className || ''}"
                  @click="${() => this.handleButtonClick(button)}"
                  title="${button.label || ''}"
                >
                  ${button.icon ? html`<span class="button-icon">${unsafeHTML(button.icon)}</span>` : button.label || ''}
                </button>
              `)}
            </div>
          ` : ''}
        </div>
        <slot></slot>
      </div>
    `;
  }
}
