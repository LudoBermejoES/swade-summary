/**
 * Jest Setup - Foundry VTT Mock Environment
 *
 * This file sets up the mock Foundry VTT global objects needed for testing.
 */

// Mock jQuery
global.$ = jest.fn((selector) => {
  const element = {
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    addClass: jest.fn().mockReturnThis(),
    removeClass: jest.fn().mockReturnThis(),
    css: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnValue({ left: 0, top: 0 }),
    outerWidth: jest.fn().mockReturnValue(50),
    outerHeight: jest.fn().mockReturnValue(50),
    data: jest.fn()
  };
  return element;
});

global.$.fn = {};

// Mock Hooks
global.Hooks = {
  once: jest.fn(),
  on: jest.fn(),
  call: jest.fn(),
  callAll: jest.fn()
};

// Mock game object - will be configured per test
global.game = {
  system: { id: 'swade' },
  user: { isGM: true },
  users: [],
  actors: {
    get: jest.fn(),
    find: jest.fn()
  },
  settings: {
    get: jest.fn(),
    set: jest.fn(),
    register: jest.fn()
  },
  i18n: {
    localize: jest.fn((key) => key)
  }
};

// Mock ui
global.ui = {
  notifications: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
};

// Mock Dialog
global.Dialog = jest.fn().mockImplementation((data, options) => ({
  render: jest.fn().mockReturnThis(),
  close: jest.fn(),
  activateListeners: jest.fn()
}));

// Mock renderTemplate
global.renderTemplate = jest.fn().mockResolvedValue('<div>Mock Template</div>');

// Mock window
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  SWADESummary: null
};

// Mock document
global.document = {
  querySelector: jest.fn(),
  createElement: jest.fn(() => ({
    setAttribute: jest.fn()
  })),
  head: {
    appendChild: jest.fn()
  }
};

// Mock console
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
