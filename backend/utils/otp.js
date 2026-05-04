const nodemailer   = require('nodemailer');
const otpGenerator = require('otp-generator');

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOTP = () =>
  otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

// ─── OTP expiry date ──────────────────────────────────────────────────────────
const otpExpiryDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + Number(process.env.OTP_EXPIRE_MINUTES || 10));
  return d;
};

// ─── Nodemailer transporter (Brevo / any SMTP) ────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Send OTP Email ───────────────────────────────────────────────────────────
const sendOtpEmail = async (to, otp, purpose = 'Login') => {
  const expireMin  = process.env.OTP_EXPIRE_MINUTES || 10;
  const storeName  = process.env.FROM_NAME || 'YourStore';

  // Development: also print to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n🔑 OTP for ${to}: ${otp}\n`);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
    .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center}
    .head h1{color:#fff;margin:0;font-size:24px;letter-spacing:1px}
    .body{padding:36px}
    .otp-box{background:#f8f9ff;border:2px dashed #4f46e5;border-radius:10px;text-align:center;padding:24px;margin:24px 0}
    .otp-code{font-size:40px;font-weight:800;letter-spacing:12px;color:#4f46e5;font-family:monospace}
    .expire{font-size:13px;color:#999;margin-top:8px}
    p{color:#555;line-height:1.7}
    .footer{background:#f8f9ff;padding:16px;text-align:center;font-size:12px;color:#aaa}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head"><h1>${storeName}</h1></div>
    <div class="body">
      <p>Hi there 👋</p>
      <p>You requested a <strong>${purpose}</strong> OTP. Use the code below:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expire">Expires in ${expireMin} minutes</div>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <p>— The ${storeName} Team</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `${otp} is your ${process.env.FROM_NAME || ''} OTP`,
    html,
  });
};

// ─── Vendor approval/rejection email ─────────────────────────────────────────
const sendVendorApprovalEmail = async (to, vendorName, approved, reason = '') => {
  const storeName = process.env.FROM_NAME || 'YourStore';
  const status    = approved ? 'Approved ✅' : 'Rejected ❌';
  const color     = approved ? '#16a34a' : '#dc2626';
  const message   = approved
    ? 'Congratulations! Your vendor account has been approved. You can now login and start listing products.'
    : `Unfortunately, your KYC was rejected.<br><strong>Reason:</strong> ${reason || 'Please contact support.'}<br>You may resubmit with corrected documents.`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#f4f4f4;margin:0;padding:0}
    .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .head{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center}
    .head h1{color:#fff;margin:0;font-size:24px}
    .body{padding:36px}
    .badge{display:inline-block;padding:8px 20px;border-radius:999px;font-weight:700;color:#fff;background:${color};margin:16px 0}
    p{color:#555;line-height:1.7}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head"><h1>${storeName}</h1></div>
    <div class="body">
      <p>Hi <strong>${vendorName}</strong>,</p>
      <p>Your KYC application status:</p>
      <div><span class="badge">${status}</span></div>
      <p>${message}</p>
      <p>— The ${storeName} Admin Team</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject: `KYC ${status} – ${storeName}`,
    html,
  });
};

module.exports = { generateOTP, otpExpiryDate, sendOtpEmail, sendVendorApprovalEmail };
