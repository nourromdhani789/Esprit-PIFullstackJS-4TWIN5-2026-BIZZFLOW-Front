import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

// Mock Notification API - must be defined before any component imports
const mockNotification = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
}));
(mockNotification as any).permission = 'default';
(mockNotification as any).requestPermission = jest.fn().mockResolvedValue('granted');

Object.defineProperty(window, 'Notification', {
  writable: true,
  configurable: true,
  value: mockNotification,
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
