import { Resend } from "resend";
import { format } from "date-fns";
import { shopName } from "@/lib/utils";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendBookingConfirmation(params: {
  to: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  start: Date;
  end: Date;
}) {
  const resend = getResend();
  if (!resend || !params.to) return { skipped: true as const };

  const from = process.env.EMAIL_FROM || "Bookings <onboarding@resend.dev>";
  const when = format(params.start, "EEEE d MMMM yyyy 'at' HH:mm");

  await resend.emails.send({
    from,
    to: params.to,
    subject: `Booking confirmed — ${shopName()}`,
    html: `
      <div style="font-family:Georgia,serif;color:#1a1a1a">
        <h1 style="font-size:22px">${shopName()}</h1>
        <p>Hi ${params.customerName},</p>
        <p>Your appointment is confirmed:</p>
        <ul>
          <li><strong>Service:</strong> ${params.serviceName}</li>
          <li><strong>Barber:</strong> ${params.barberName}</li>
          <li><strong>When:</strong> ${when}</li>
        </ul>
        <p>See you soon.</p>
      </div>
    `,
  });

  return { skipped: false as const };
}
