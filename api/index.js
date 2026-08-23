const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const Booking = require('./models/Booking');
const Admin = require('./models/Admin');
const Content = require('./models/Content');
const { requireAdmin, JWT_SECRET } = require('./middleware/auth');
const { escape, detailRows, button, highlight, shell } = require('./emails');

const app = express();
const PORT = process.env.PORT || 3000;

// FRONTEND_URL can be a single URL or a comma-separated list (e.g. website + admin panel domains)
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin, req) {
  // No origin at all: curl, server-to-server, or a page opened from file://
  if (!origin || origin === 'null') return true;
  if (LOCAL_ORIGIN.test(origin)) return true;
  if (allowedOrigins.includes(origin)) return true;

  // The pages and this API are served by the same deployment, so a request from
  // the very host that served the page is this site talking to itself. Without
  // this, the site breaks on any address FRONTEND_URL does not list — the
  // www/non-www twin, or a Vercel preview URL.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch (err) {
    return false;
  }
}

app.use(
  cors((req, callback) => {
    const origin = req.headers.origin;
    callback(
      isAllowedOrigin(origin, req) ? null : new Error('Not allowed by CORS'),
      {
        origin: origin || true,
        methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    );
  })
);

// A blocked origin used to surface as a 500, which reads like the server is
// broken. Say what actually happened instead.
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    console.warn('Blocked cross-origin request from', req.headers.origin);
    return res.status(403).json({
      success: false,
      message: 'This website address is not allowed to use the booking API.'
    });
  }
  next(err);
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// On Vercel the pages in /public are served by the platform, so the frontend is
// deployed separately. Locally we serve them from this same server (before the
// database-wait middleware, so pages still load when MongoDB is unreachable).
if (require.main === module) {
  app.use(express.static(require('path').resolve(__dirname, '..', 'public')));
}

// First-run admin login. Set ADMIN_USERNAME / ADMIN_PASSWORD in the environment:
// the fallback below is public knowledge (it lives in this file) and anyone who
// knows it can read every customer's contact details, so it must be replaced
// before the site handles real bookings.
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@pacific.duct';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345678';

async function ensureDefaultAdmin() {
  try {
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        '⚠️  ADMIN_PASSWORD is not set — falling back to the password committed in this file. ' +
          'Set ADMIN_USERNAME/ADMIN_PASSWORD, or run: node api/scripts/createAdmin.js <username> <password>'
      );
    }

    const existing = await Admin.findOne({ username: DEFAULT_ADMIN_USERNAME });
    if (!existing) {
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await Admin.create({ username: DEFAULT_ADMIN_USERNAME, passwordHash });
      console.log(`✅ Admin account created: ${DEFAULT_ADMIN_USERNAME}`);
    }
  } catch (err) {
    console.error('❌ Failed to ensure default admin:', err.message);
  }
}

// Serverless-safe MongoDB connection: cache the connection promise across
// invocations of the same warm Lambda instance instead of reconnecting
// (and racing with incoming requests) on every cold start.
let cachedConnection = global._mongooseConnection;
if (!cachedConnection) {
  cachedConnection = global._mongooseConnection = mongoose
    .connect(process.env.MONGODB_URI)
    .then((conn) => {
      console.log('✅ MongoDB Connected Successfully!');
      ensureDefaultAdmin();
      return conn;
    })
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
      global._mongooseConnection = null;
      throw err;
    });
  // Keep the rejection from crashing the process as an unhandled rejection; the
  // request middleware below awaits the same promise and turns it into a 503.
  cachedConnection.catch(() => {});
}

// Make sure every request waits for the connection before hitting a route
app.use(async (req, res, next) => {
  try {
    await cachedConnection;
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable, please try again shortly' });
  }
});

// Email configuration.
// Set EMAIL_HOST to send through your own mailbox (e.g. smtp.hostinger.com for
// info@pacificductpros.com). Without it we fall back to Gmail, which is how
// this ran before the domain mailbox existed.
const transporter = nodemailer.createTransport(
  process.env.EMAIL_HOST
    ? {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 465,
        // Port 465 is implicit TLS; 587 upgrades with STARTTLS instead.
        secure: (Number(process.env.EMAIL_PORT) || 465) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    : {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
);

// Mailboxes reject a From address they do not own, so this must stay the
// authenticated account. The name is what the customer sees in their inbox.
const MAIL_FROM = process.env.EMAIL_FROM || `"Pacific Duct Systems" <${process.env.EMAIL_USER}>`;

// Shown in the footer of every email we send.
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
const CONTACT_PHONE = process.env.CONTACT_PHONE || '(469) 898-9044';

// Absolute links can only be built when we know where the site lives.
const siteBaseUrl = () => allowedOrigins[0] || '';

// Check the mailbox credentials on startup locally. Skipped on Vercel, where
// this would open an SMTP connection on every cold start.
if (require.main === module) {
  transporter.verify((err) => {
    if (err) console.error('❌ Email transport not ready:', err.message);
    else console.log(`✅ Email ready, sending as ${MAIL_FROM}`);
  });
}

  // Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: admin._id, username: admin.username }, JWT_SECRET, {
      expiresIn: '12h'
    });

    res.json({ success: true, token, username: admin.username });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Verify current token / session
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ success: true, username: req.admin.username });
});

// ---- CMS: site content (public read, admin write) ----

async function getOrCreateContent() {
  let content = await Content.findOne({ key: 'site' });
  if (!content) {
    content = await Content.create({ key: 'site' });
  }
  return content;
}

// Public: website reads content here
app.get('/api/content', async (req, res) => {
  try {
    const content = await getOrCreateContent();
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
});

// Admin: update content (full or partial sections)
app.put('/api/content', requireAdmin, async (req, res) => {
  try {
    const allowedFields = ['hero', 'contact', 'services', 'testimonials', 'pricing'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const content = await Content.findOneAndUpdate(
      { key: 'site' },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({ success: true, content });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, message: 'Failed to update content' });
  }
});

// Public: limited booking info for confirmation/invoice/completion pages
// (no auth — the booking's MongoDB _id itself acts as the access token,
// same pattern as e-commerce order-confirmation links)
app.get('/api/bookings/:id/public', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).select(
      'name service address city state zipCode status submittedAt scheduledDate payment'
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, booking });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Booking not found' });
  }
});

// Get all bookings (Admin endpoint)
app.get('/api/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ submittedAt: -1 }).limit(50);
    res.json({
      success: true,
      count: bookings.length,
      bookings: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.json({
      success: true,
      booking: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// Form submission endpoint
app.post('/api/submit-booking', async (req, res) => {
  try {
    const { name, service, email, phone, address, city, state, zipCode, message } = req.body;

    // Validation
    if (!name || !service || !email || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Get client IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Save to MongoDB
    const newBooking = new Booking({
      name,
      service,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      message: message || '',
      ipAddress
    });

    const savedBooking = await newBooking.save();
    console.log('✅ Booking saved to database:', savedBooking._id);

    // Full address for display
    const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;

    // Email content for admin
    const bookingLink = siteBaseUrl() ? `${siteBaseUrl()}/confrimBooking.html?id=${savedBooking._id}` : '';
    const adminMailOptions = {
      from: MAIL_FROM,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `New booking: ${service} - ${name}`,
      html: shell({
        title: 'New Booking Request',
        intro: `<strong>${escape(name)}</strong> has requested <strong>${escape(service)}</strong>.`,
        body:
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
          detailRows([
            ['Customer', escape(name)],
            ['Service', escape(service)],
            ['Email', `<a href="mailto:${escape(email)}" style="color:#003366;">${escape(email)}</a>`],
            ['Phone', `<a href="tel:${escape(phone)}" style="color:#003366;">${escape(phone)}</a>`],
            ['Service address', `${escape(address)}<br>${escape(city)}, ${escape(state)} ${escape(zipCode)}`],
            ['Customer note', message ? escape(message) : ''],
            ['Booking ID', escape(savedBooking._id)],
            ['Received', escape(new Date().toLocaleString('en-US'))],
          ]) +
          `</table>` +
          button(bookingLink, 'Open Booking') +
          `<p style="margin:18px 0 0;font-size:14px;color:#6b7280;">Status is <strong>Pending</strong> until you schedule the visit.</p>`,
        contactEmail: CONTACT_EMAIL,
        contactPhone: CONTACT_PHONE,
      })
    };

    // Email content for customer (confirmation)
    const customerMailOptions = {
      from: MAIL_FROM,
      to: email,
      subject: 'We received your booking - Pacific Duct Systems',
      html: shell({
        title: 'Booking Received',
        intro: `Hello ${escape(name)}, thank you for choosing Pacific Duct Systems. We have your request and are reviewing it now.`,
        body:
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
          detailRows([
            ['Service', escape(service)],
            ['Service address', `${escape(address)}<br>${escape(city)}, ${escape(state)} ${escape(zipCode)}`],
            ['Phone', escape(phone)],
            ['Your note', message ? escape(message) : ''],
            ['Booking reference', escape(savedBooking._id)],
          ]) +
          `</table>` +
          button(bookingLink, 'View Your Booking') +
          `<p style="margin:22px 0 0;"><strong>What happens next:</strong> we will confirm your visit date by email shortly. No payment is taken now.</p>`,
        contactEmail: CONTACT_EMAIL,
        contactPhone: CONTACT_PHONE,
      })
    };

    // Send emails (best-effort — a booking is still valid even if email delivery fails,
    // e.g. EMAIL_USER/EMAIL_PASS not configured yet)
    try {
      await transporter.sendMail(adminMailOptions);
      await transporter.sendMail(customerMailOptions);
      console.log('✅ Emails sent successfully');
    } catch (emailError) {
      console.error('⚠️ Booking saved but email failed to send:', emailError.message);
    }

    // Success response
    res.json({
      success: true,
      message: 'Booking request submitted successfully!',
      bookingId: savedBooking._id
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process booking. Please try again later.'
    });
  }
});

// Update booking status (Admin endpoint)
app.patch('/api/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
});

// Schedule a booking's visit date (Admin endpoint) — sets the date, marks
// the booking confirmed, and emails the customer with the date + a link
// to their booking confirmation page (no technician details are sent).
app.patch('/api/bookings/:id/schedule', requireAdmin, async (req, res) => {
  try {
    const { scheduledDate } = req.body;

    if (!scheduledDate || isNaN(new Date(scheduledDate).getTime())) {
      return res.status(400).json({ success: false, message: 'A valid scheduledDate is required' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { scheduledDate: new Date(scheduledDate), status: 'confirmed' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const siteUrl = allowedOrigins[0] || '';
    const confirmationLink = siteUrl ? `${siteUrl}/confrimBooking.html?id=${booking._id}` : '';
    const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: booking.email,
        subject: 'Your visit is scheduled - Pacific Duct Systems',
        html: shell({
          title: 'Your Visit Is Scheduled',
          intro: `Hello ${escape(booking.name)}, good news \u2014 your <strong>${escape(booking.service)}</strong> appointment is confirmed.`,
          body:
            highlight(`Our team will arrive on ${formattedDate}`) +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
            detailRows([
              ['Service', escape(booking.service)],
              ['Service address', `${escape(booking.address)}<br>${escape(booking.city)}, ${escape(booking.state)} ${escape(booking.zipCode)}`],
              ['Booking reference', escape(booking._id)],
            ]) +
            `</table>` +
            button(confirmationLink, 'View Booking Details') +
            `<p style="margin:22px 0 0;">Need to reschedule? Just reply to this email or call us and we will find another time.</p>`,
          contactEmail: CONTACT_EMAIL,
          contactPhone: CONTACT_PHONE,
        })
      });
      console.log('✅ Scheduling email sent to', booking.email);
    } catch (emailError) {
      console.error('⚠️ Booking scheduled but email failed to send:', emailError.message);
    }

    res.json({ success: true, message: 'Booking scheduled and customer notified', booking });
  } catch (error) {
    console.error('Error scheduling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule booking' });
  }
});

// Admin: record a payment (or undo one). Marking a booking paid turns its
// invoice into a receipt and emails the customer a confirmation.
app.patch('/api/bookings/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { amount, method, note, unpaid } = req.body;

    if (unpaid) {
      const booking = await Booking.findByIdAndUpdate(
        req.params.id,
        { payment: { status: 'unpaid', amount: null, method: null, paidAt: null, note: '' } },
        { new: true }
      );
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      return res.json({ success: true, message: 'Payment cleared', booking });
    }

    const value = Number(amount);
    if (!isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'A payment amount is required' });
    }

    const ALLOWED_METHODS = ['cash', 'card', 'bank', 'other'];
    const paymentMethod = ALLOWED_METHODS.includes(method) ? method : 'other';

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        payment: {
          status: 'paid',
          amount: value,
          method: paymentMethod,
          paidAt: new Date(),
          note: (note || '').trim()
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const siteUrl = allowedOrigins[0] || '';
    const receiptLink = siteUrl ? `${siteUrl}/paid_invoice.html?id=${booking._id}` : '';
    const formattedAmount = `$${value.toFixed(2)}`;
    const METHOD_LABELS = { cash: 'Cash', card: 'Card', bank: 'Bank transfer', other: 'Other' };

    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: booking.email,
        subject: 'Payment received - Pacific Duct Systems',
        html: shell({
          title: 'Payment Received',
          intro: `Hello ${escape(booking.name)}, thank you \u2014 we have received your payment for <strong>${escape(booking.service)}</strong>.`,
          body:
            highlight(`${formattedAmount} paid`) +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
            detailRows([
              ['Service', escape(booking.service)],
              ['Payment method', escape(METHOD_LABELS[paymentMethod])],
              ['Service address', `${escape(booking.address)}<br>${escape(booking.city)}, ${escape(booking.state)} ${escape(booking.zipCode)}`],
              ['Booking reference', escape(booking._id)],
            ]) +
            `</table>` +
            button(receiptLink, 'View Your Receipt') +
            `<p style="margin:22px 0 0;">Please keep this email for your records. If anything looks wrong, reply here and we will sort it out.</p>`,
          contactEmail: CONTACT_EMAIL,
          contactPhone: CONTACT_PHONE,
        })
      });
      console.log('✅ Receipt email sent to', booking.email);
    } catch (emailError) {
      console.error('⚠️ Payment recorded but email failed to send:', emailError.message);
    }

    res.json({ success: true, message: 'Payment recorded and customer notified', booking });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

module.exports = app;

// If this file is run directly, start the server for local development
if (require.main === module) {
  // The pages call http://localhost:4000/api during local development.
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running for local development on http://localhost:${PORT}`);
  });
}
