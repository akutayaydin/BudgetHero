// Simple script to trigger bill notifications manually for testing
const { processPendingNotifications } = await import('./server/lib/notification-service.js');

console.log('🔔 Manually triggering bill notification check...');

try {
  await processPendingNotifications();
  console.log('✅ Notification process completed successfully!');
} catch (error) {
  console.error('❌ Error during notification process:', error);
}

process.exit(0);