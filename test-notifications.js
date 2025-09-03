// Test script to manually trigger bill notifications for testing
const { db } = await import('./server/db.js');
const { recurringTransactions, manualSubscriptions } = await import('./shared/schema.js');
const { processPendingNotifications } = await import('./server/lib/notification-service.js');
const { eq } = await import('drizzle-orm');

console.log('🧪 Testing bill notification system...');

// First, let's see what bills we have for the test user
const userId = '42553967';

console.log('\n📋 Checking existing bills for user:', userId);

// Check recurring transactions
const recurring = await db
  .select()
  .from(recurringTransactions)
  .where(eq(recurringTransactions.userId, userId));

console.log('Recurring transactions:', recurring.length);
recurring.forEach(bill => {
  console.log(`- ${bill.name}: $${bill.amount} due ${bill.nextDueDate}`);
});

// Check manual subscriptions
const manual = await db
  .select()
  .from(manualSubscriptions)
  .where(eq(manualSubscriptions.userId, userId));

console.log('\nManual subscriptions:', manual.length);
manual.forEach(bill => {
  console.log(`- ${bill.name}: $${bill.amount} starts ${bill.startDate}`);
});

// Create a test bill due tomorrow for testing
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

console.log('\n🔧 Creating test bill due tomorrow for notification testing...');

try {
  const testBill = await db.insert(recurringTransactions).values({
    id: `test-bill-${Date.now()}`,
    userId: userId,
    name: 'Test Bill Notification',
    amount: 29.99,
    nextDueDate: tomorrow,
    frequency: 30,
    isActive: true,
    category: 'Bills & Utilities',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  console.log('✅ Test bill created:', testBill[0]);

  // Now trigger the notification process
  console.log('\n🔔 Triggering notification process...');
  await processPendingNotifications();
  
  console.log('✅ Notification process completed! Check your email for the bill reminder.');
  
} catch (error) {
  console.error('❌ Error creating test bill:', error);
}

process.exit(0);