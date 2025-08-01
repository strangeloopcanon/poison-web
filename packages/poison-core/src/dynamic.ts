import { Technique } from './index';

export interface DynamicInjectOptions {
  payload: string;
  techniques: Technique[];
  selector?: string;
  interval?: number; // Re-injection interval in ms
  observe?: boolean; // Use MutationObserver
}

// Dynamic injection for non-static sites
export function injectDynamic(options: DynamicInjectOptions): void {
  const { payload, techniques, selector, interval = 5000, observe = true } = options;
  
  // Initial injection
  injectCurrentContent();
  
  if (observe) {
    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      injectCurrentContent();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else if (interval > 0) {
    // Periodic re-injection
    setInterval(injectCurrentContent, interval);
  }
  
  function injectCurrentContent() {
    const html = document.documentElement.outerHTML;
    const poisoned = inject(html, {
      payload,
      techniques
    });
    
    // Replace content if changed
    if (poisoned !== html) {
      document.documentElement.innerHTML = poisoned;
    }
  }
}

// For React/Vue/Angular apps
export function injectIntoReactApp(options: DynamicInjectOptions): void {
  // Wait for React to finish rendering
  const waitForReact = () => {
    if (document.querySelector('[data-reactroot]') || document.querySelector('#root')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForReact, 100);
    }
  };
  
  waitForReact();
}

// For Vue apps
export function injectIntoVueApp(options: DynamicInjectOptions): void {
  const waitForVue = () => {
    if (document.querySelector('#app') || document.querySelector('[data-v-]')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForVue, 100);
    }
  };
  
  waitForVue();
}

// For Angular apps
export function injectIntoAngularApp(options: DynamicInjectOptions): void {
  const waitForAngular = () => {
    if (document.querySelector('[ng-version]') || document.querySelector('app-root')) {
      injectDynamic(options);
    } else {
      setTimeout(waitForAngular, 100);
    }
  };
  
  waitForAngular();
}

// Import the inject function
import { inject } from './index'; 