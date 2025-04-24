import { log } from './log.client.ts';

export abstract class BaseComponent<T extends HTMLElement = HTMLElement> {
  constructor(protected $el: T) {}
  public abstract init(): void;
}

export interface BaseComponentConstructor<T extends HTMLElement> {
  new ($el: HTMLElement): BaseComponent<T>;
}

export function registerComponent<T extends HTMLElement>(
  selector: string,
  Component: BaseComponentConstructor<T>,
) {
  document.querySelectorAll(selector).forEach(($el) => {
    log.debug(`Register component ${Component.name} for ${selector}`);

    if ($el instanceof HTMLElement) {
      new Component($el).init();
    }
  });
}

export abstract class BaseCustomElement extends HTMLElement {
  // eventListenerRemovers: Array<() => void> = [];

  protected connected(): void {
    // default: no-op
  }

  protected disconnected(): void {
    // default: no-op
  }

  protected $$<T extends HTMLElement>(selector: string): T[] {
    return Array.from(this.querySelectorAll<T>(selector));
  }

  protected $<T extends HTMLElement>(selector: string): T {
    const element = this.querySelector<T>(selector);

    if (!element) {
      throw new Error(`[${this.localName}]: Could not find ${selector}`);
    }

    return element;
  }

  // protected on<K extends keyof HTMLElementEventMap, T extends HTMLElement>(
  //   element: T,
  //   event: K,
  //   callback: (event: HTMLElementEventMap[K]) => void,
  // ): () => void {
  //   element.addEventListener(event, callback);
  //
  //   const remover = () => {
  //     element.removeEventListener(event, callback);
  //     this.eventListenerRemovers = this.eventListenerRemovers.filter(
  //       (r) => r !== remover,
  //     );
  //   };
  //
  //   this.eventListenerRemovers.push(remover);
  //
  //   return remover;
  // }

  connectedCallback() {
    log.debug(`Connecting custom element for ${this.localName}`);

    this.connected();
  }

  disconnectedCallback() {
    log.debug(`Disconnecting custom element for ${this.localName}`);

    // for (const remover of this.eventListenerRemovers) {
    //   remover();
    // }

    this.disconnected();
  }
}
