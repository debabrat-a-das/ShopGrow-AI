import { store } from '../db/store.js';
import { PasswordService } from '../services/passwordService.js';

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.RESET_ADMIN_EMAIL || 'admin@shopgrow.ai').toLowerCase().trim();
  const newPassword = args[1] || process.env.NEW_ADMIN_PASSWORD;

  if (!newPassword) {
    console.error('Error: New password must be provided.');
    console.log('Usage: node resetAdminPassword.js <admin-email> <new-password>');
    process.exit(1);
  }

  const policy = PasswordService.validatePolicy(newPassword);
  if (!policy.valid) {
    console.error(`Password Policy Error: ${policy.error}`);
    process.exit(1);
  }

  const result = store.setAdminPassword(email, newPassword);
  if (!result.success) {
    console.error(`Failed to reset password: ${result.error}`);
    process.exit(1);
  }

  console.log(`[SUCCESS] Admin password for ${email} has been securely updated and hashed.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});