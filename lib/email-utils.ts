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
        // Verify the file exists before adding it
        try {
          const fileInfo = await FileSystem.getInfoAsync(options.attachmentPath);
          if (fileInfo.exists) {
            attachments.push(options.attachmentPath);
            console.log("Invoice PDF attached:", options.attachmentPath);
          } else {
            console.warn("Attachment file not found:", options.attachmentPath);
          }
        } catch (fileError) {
          console.warn("Error checking attachment file:", fileError);
        }
      } else {
        // For web, we would need to handle differently
        console.warn("Email attachment not fully supported on web");
      }
    }

    // Add additional attachments
    if (options.additionalAttachments && options.additionalAttachments.length > 0) {
      if (Platform.OS !== "web") {
        for (const att of options.additionalAttachments) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(att.path);
            if (fileInfo.exists) {
              attachments.push(att.path);
            }
          } catch (fileError) {
            console.warn("Error checking additional attachment:", fileError);
          }
        }
      }
    }

    // Compose and send email
    const result = await MailComposer.composeAsync({
      recipients: options.to,
      subject: options.subject,
      body: options.body,
      attachments: attachments,
    });

    console.log("Email composition result:", result.status);
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

Veuillez trouver ci-joint votre facture de livraison d'uree.

Details de la livraison:
- Numero de facture: ${invoiceData.invoiceNumber}
- Site: ${invoiceData.siteName}
- Quantite livree: ${invoiceData.litersDelivered} litres
- Montant total: $${invoiceData.total.toFixed(2)}

Merci de votre confiance!

Cordialement,
SP Logistix
Livraison d'uree
  `.trim();

  return body;
}
