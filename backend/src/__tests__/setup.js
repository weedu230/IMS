// Load test environment variables before any test runs
process.env.NODE_ENV        = 'test';
process.env.JWT_SECRET      = 'test_jwt_secret_key_for_unit_tests_only_32ch';
process.env.JWT_EXPIRES_IN  = '1h';
process.env.BCRYPT_ROUNDS   = '4';   // Low cost for speed in tests
process.env.PORT            = '5001';
process.env.LOG_LEVEL       = 'error'; // Suppress logs during tests

// DB (used only by integration tests — unit tests mock the DB)
process.env.DB_NAME     = 'waleeds_data_test';
process.env.DB_USER     = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_HOST     = 'localhost';
process.env.DB_PORT     = '3306';
