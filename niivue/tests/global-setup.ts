import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Global setup logic here
  console.log('Starting global setup...')

  // You can start services, seed databases, etc.
  // For example, ensure test data is available

  console.log('Global setup completed')
}

export default globalSetup
