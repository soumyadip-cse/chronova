#!/usr/bin/env tsx

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'ENCRYPTION_MASTER_KEY',
] as const;

const optionalEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AI_PROVIDER',
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_PORT',
  'EMAIL_SERVER_USER',
  'EMAIL_SERVER_PASSWORD',
  'EMAIL_FROM',
  'ENCRYPTION_SALT',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];
type OptionalEnvVar = (typeof optionalEnvVars)[number];

function validateEnv(): void {
  console.log('🔍 Validating environment variables...\n');

  const missingRequired: RequiredEnvVar[] = [];
  const missingOptional: OptionalEnvVar[] = [];

  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingRequired.push(varName);
      console.log(`  ❌ ${varName}: MISSING (required)`);
    } else {
      console.log(`  ✅ ${varName}: SET`);
    }
  }

  // Validate NEXTAUTH_SECRET length
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret && nextAuthSecret.length < 32) {
    console.error('  ❌ NEXTAUTH_SECRET: MUST BE AT LEAST 32 CHARACTERS');
    missingRequired.push('NEXTAUTH_SECRET' as RequiredEnvVar);
  } else if (nextAuthSecret) {
    console.log(`  ✅ NEXTAUTH_SECRET: VALID LENGTH (${nextAuthSecret.length} chars)`);
  }

  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingOptional.push(varName);
      console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
    } else {
      console.log(`  ✅ ${varName}: SET`);
    }
  }

  console.log('');

  if (missingRequired.length > 0) {
    console.error('❌ Validation failed: Missing required environment variables:');
    for (const varName of missingRequired) {
      console.error(`   - ${varName}`);
    }
    console.error('\nPlease check your .env file or deployment environment configuration.');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Warning: Some optional environment variables are not set:');
    for (const varName of missingOptional) {
      console.warn(`   - ${varName}`);
    }
    console.warn('\nSome features may not work without these variables.');
  }

  console.log('\n✅ Environment validation passed!');
}

validateEnv();
