import * as Notifications from 'expo-notifications';
import { getOverdueInvoices, getUnpaidInvoices } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function checkAndSendReminders() {
  try {
    // Get overdue invoices (more than 10 days old and unpaid)
    const overdueInvoices = await getOverdueInvoices(10);
    
    if (overdueInvoices.length > 0) {
      // Send notification for overdue invoices
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Factures en retard',
          body: `Vous avez ${overdueInvoices.length} facture(s) impayée(s) depuis plus de 10 jours.`,
          data: {
            type: 'overdue_invoices',
            count: overdueInvoices.length,
          },
        },
        trigger: null, // Send immediately
      });
    }

    // Get all unpaid invoices
    const unpaidInvoices = await getUnpaidInvoices();
    
    if (unpaidInvoices.length > 0) {
      // Send notification for unpaid invoices
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Factures impayées',
          body: `Vous avez ${unpaidInvoices.length} facture(s) en attente de paiement.`,
          data: {
            type: 'unpaid_invoices',
            count: unpaidInvoices.length,
          },
        },
        trigger: null, // Send immediately
      });
    }

    console.log('Reminders checked:', {
      overdue: overdueInvoices.length,
      unpaid: unpaidInvoices.length,
    });
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

export async function scheduleReminderCheck() {
  try {
    // Schedule reminder check every 24 hours (86400 seconds)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vérification des factures',
        body: 'Vérification des factures impayées...',
      },
      trigger: {
        seconds: 86400, // 24 hours
      } as any,
    });
  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
}

export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Initialize reminder service
export async function initializeReminderService() {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (hasPermission) {
      await scheduleReminderCheck();
      await checkAndSendReminders();
    }
  } catch (error) {
    console.error('Error initializing reminder service:', error);
  }
}
