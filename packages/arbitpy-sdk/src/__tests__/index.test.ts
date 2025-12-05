// Basic test suite for ArbitPy SDK
import ArbitPySDK from '../index.js';

describe('ArbitPySDK', () => {
  let sdk: ArbitPySDK;

  beforeEach(() => {
    sdk = new ArbitPySDK({
      apiUrl: 'http://localhost:5000/api/v1',
    });
  });

  afterEach(() => {
    sdk.removeAllListeners();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultSdk = new ArbitPySDK();
      const config = defaultSdk.getConfig();
      
      expect(config.apiUrl).toBe('http://localhost:5000/api/v1');
      expect(config.timeout).toBe(30000);
    });

    it('should initialize with custom config', () => {
      const customSdk = new ArbitPySDK({
        apiUrl: 'https://api.arbitpy.com/v1',
        apiKey: 'test-key',
        timeout: 60000,
      });
      
      const config = customSdk.getConfig();
      
      expect(config.apiUrl).toBe('https://api.arbitpy.com/v1');
      expect(config.apiKey).toBe('test-key');
      expect(config.timeout).toBe(60000);
    });
  });

  describe('Module Initialization', () => {
    it('should initialize all modules', () => {
      expect(sdk.compiler).toBeDefined();
      expect(sdk.deployment).toBeDefined();
      expect(sdk.ai).toBeDefined();
    });

    it('should create contract instances', () => {
      const contract = sdk.contract(
        '0x1234567890123456789012345678901234567890',
        [],
        'arbitrum-sepolia'
      );
      
      expect(contract).toBeDefined();
      expect(contract.address).toBe('0x1234567890123456789012345678901234567890');
      expect(contract.network).toBe('arbitrum-sepolia');
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      sdk.updateConfig({
        apiKey: 'new-key',
        timeout: 45000,
      });
      
      const config = sdk.getConfig();
      expect(config.apiKey).toBe('new-key');
      expect(config.timeout).toBe(45000);
    });
  });

  describe('Event Forwarding', () => {
    it('should forward events from modules', (done) => {
      sdk.on('error', (error: Error) => {
        expect(error).toBeInstanceOf(Error);
        done();
      });

      // Trigger error event from compiler
      sdk.compiler.emit('error', new Error('Test error'));
    });
  });

  describe('Static Methods', () => {
    it('should return version info', () => {
      expect(ArbitPySDK.getVersion()).toBe('1.0.0');
    });

    it('should return SDK info', () => {
      const info = ArbitPySDK.getInfo();
      
      expect(info.name).toBe('@arbitpy/sdk');
      expect(info.version).toBe('1.0.0');
      expect(info.author).toBe('BROTHERHOOD Team');
      expect(info.license).toBe('MIT');
    });
  });
});