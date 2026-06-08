import { Window, SVGElement } from 'happy-dom'

const window = new Window()

const globals = [
  'document',
  'window',
  'navigator',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLButtonElement',
  'HTMLDivElement',
  'HTMLSpanElement',
  'Element',
  'Node',
  'Document',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'Comment',
  'Text',
  'DOMParser',
  'MutationObserver',
  'DOMRect',
  'DOMTokenList',
  'Attr',
  'HTMLCollection',
  'NodeList',
  'CSSStyleDeclaration',
  'Storage',
  'Location',
] as const

for (const name of globals) {
  if ((window as any)[name]) {
    ;(globalThis as any)[name] = (window as any)[name]
  }
}

;(globalThis as any).SVGElement = SVGElement
