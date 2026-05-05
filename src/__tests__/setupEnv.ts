// Mock Notification API before any component imports
// This must be defined here (in setupFiles) so it's available when components load

// Polyfill TextEncoder/TextDecoder for jsdom environment
import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Create a proper Notification constructor mock
function MockNotification() {
  return { close: jest.fn() };
}
(MockNotification as any).permission = 'default';
(MockNotification as any).requestPermission = jest.fn().mockResolvedValue('granted');

// Set up the mock on global, window, and globalThis
// @ts-ignore
global.Notification = MockNotification;
// @ts-ignore
global.window = global.window || {};
// @ts-ignore
global.window.Notification = MockNotification;
// @ts-ignore
global.globalThis = global.globalThis || global;
// @ts-ignore
global.globalThis.Notification = MockNotification;
