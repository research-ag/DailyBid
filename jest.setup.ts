import '@testing-library/jest-dom'
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollTo if it doesn't exist
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollTo =
    window.HTMLElement.prototype.scrollTo || function () {}
}
