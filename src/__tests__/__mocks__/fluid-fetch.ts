// Mock for fluid-fetch as a constructor with options
export default function FluidFetch(this: any, options = {}) {
  // Store options
  this.options = options;
  
  // Define middlewares
  const middlewares = {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  };
  
  // Define request method
  const request = jest.fn().mockImplementation(() => Promise.resolve({
    data: {},
    headers: {},
    status: 200
  }));
  
  // Assign properties to this.api
  this.middlewares = middlewares;
  this.request = request;
  
  // Create api property for compatibility
  this.api = {
    middlewares,
    request
  };
}

// Make it constructable without 'new'
FluidFetch.prototype.constructor = FluidFetch;