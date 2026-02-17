import { Platform } from "react-native";
import * as MailComposer from "expo-mail-composer";
import * as FileSystem from "expo-file-system/legacy";

export interface EmailOptions {
  to: string[];
  subject: string;
  body: string;
  attachmentPath?: string;
  attachmentMimeType?: string;
  additionalAttachments?: Array<{
    path: string;
    mimeType?: string;
    filename?: string;
  }>;
}

export async function sendEmailWithAttachment(options: EmailOptions): Promise<boolean> {
  try {
    // Check if mail composer is available
    const isAvailable = await MailComposer.isAvailableAsync();

    if (!isAvailable) {
      console.warn("Mail composer is not available on this device");
      return false;
    }

    const attachments: string[] = [];

    // Add main attachment if provided
    if (options.attachmentPath) {
      // For mobile, we need to use the file URI directly
      if (Platform.OS !== "web") {
        attachments.push(options.attachmentPath);
      } else {
        // For web, we would need to handle differently
        console.warn("Email attachment not fully supported on web");
      }
    }

    // Add additional attachments
    if (options.additionalAttachments && options.additionalAttachments.length > 0) {
      if (Platform.OS !== "web") {
        options.additionalAttachments.forEach((att) => {
          attachments.push(att.path);
        });
      }
    }

    // Compose and send email
    const result = await MailComposer.composeAsync({
      recipients: options.to,
      subject: options.subject,
      body: options.body,
      attachments: attachments,
    });

    return result.status === MailComposer.MailComposerStatus.SENT;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export async function generateEmailBody(invoiceData: {
  invoiceNumber: string;
  clientName: string;
  litersDelivered: number;
  total: number;
  siteName: string;
}): Promise<string> {
  const body = `
Bonjour ${invoiceData.clientName},

Veuillez trouver ci-joint votre facture de livraison d'urée.

Détails de la livraison:
- Numéro de facture: ${invoiceData.invoiceNumber}
- Site: ${invoiceData.siteName}
- Quantité livrée: ${invoiceData.litersDelivered} litres
- Montant total: $${invoiceData.total.toFixed(2)}

Merci de votre confiance!

Cordialement,
SP Logistix
Livraison d'urée
  `.trim();

  return body;
}
