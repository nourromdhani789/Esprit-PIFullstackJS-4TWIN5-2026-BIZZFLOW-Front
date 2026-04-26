const api = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: {
    baseURL: 'http://localhost:3000',
    headers: {
      common: {},
    },
  },
};

export default api;
