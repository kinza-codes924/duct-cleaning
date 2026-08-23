/**
 * Seeds the CMS document with the service list, contact details and
 * testimonials the website falls back to when the database is empty.
 *
 * Existing values are kept: only fields that are missing or empty get filled,
 * so running this again after the admin has edited content is safe.
 *
 *   node api/scripts/seedContent.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Content = require('../models/Content');

const SERVICES = [
  {
    title: 'Air Duct Cleaning',
    category: 'Cleaning',
    description:
      'Complete cleaning of your HVAC air ducts to remove dust, debris, and allergens for improved air quality.',
    icon: 'air',
    price: '$199',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #003366, #001e40)',
  },
  {
    title: 'Dryer Vent Cleaning',
    category: 'Cleaning',
    description:
      'Professional dryer vent cleaning to prevent fire hazards and improve dryer efficiency.',
    icon: 'dry',
    price: '$150',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #1facb6, #002326)',
  },
  {
    title: 'Air Vent Cleaning',
    category: 'Cleaning',
    description:
      'Thorough cleaning of air vents and registers to ensure optimal airflow throughout your space.',
    icon: 'mode_fan',
    price: '$199',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #3a5f94, #001e40)',
  },
  {
    title: 'Deep Air Vent Cleaning',
    category: 'Cleaning',
    description:
      'Intensive deep cleaning service for heavily soiled vents and hard-to-reach areas.',
    icon: 'cleaning_services',
    price: '$499',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #002326, #001e40)',
  },
  {
    title: 'Furnace Cleaning',
    category: 'Cleaning',
    description:
      'Complete furnace cleaning and maintenance to ensure efficient heating and clean air circulation.',
    icon: 'hvac',
    price: '$199',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #004f54, #001e40)',
  },
  {
    title: 'Chimney Cleaning',
    category: 'Cleaning',
    description:
      'Complete chimney cleaning and maintenance for safe airflow and a clean, smoke-free home.',
    icon: 'fireplace',
    price: '$199',
    priceLabel: 'Starting from',
    cta: 'Book Now',
    gradient: 'linear-gradient(135deg, #003366, #002326)',
  },
  {
    title: 'HVAC System Installation',
    category: 'Installation',
    description:
      'Complete HVAC and air duct system installation tailored to your space, engineered for proper airflow, improved ventilation, and maximum energy efficiency.',
    icon: 'heat_pump',
    price: 'Custom',
    priceLabel: 'Quote',
    cta: 'Contact Us',
    gradient: 'linear-gradient(135deg, #1f477b, #001e40)',
  },
  {
    title: 'AC System Installation',
    category: 'Installation',
    description:
      'Professional setup of air conditioning systems for efficient cooling, proper airflow, and long-lasting performance.',
    icon: 'ac_unit',
    price: 'Custom',
    priceLabel: 'Quote',
    cta: 'Contact Us',
    gradient: 'linear-gradient(135deg, #003366, #1facb6)',
  },
  {
    title: 'Custom Solutions',
    category: 'Installation',
    description:
      'Have a unique requirement? Our team designs custom air quality solutions built around your exact space and needs.',
    icon: 'design_services',
    price: 'Custom',
    priceLabel: 'Quote',
    cta: 'Contact Us',
    gradient: 'linear-gradient(135deg, #002326, #003366)',
  },
];

// Titles that changed after the service list was first saved. The website and
// the booking dropdown read titles straight from the database, so a list saved
// under the old name keeps showing it until this runs.
const RENAMES = {
  'Air Duct System Installation': 'HVAC System Installation',
};

// Addresses the site used before the domain mailbox existed; a saved contact
// still holding one of these gets moved to the new address.
const OLD_EMAILS = ['pacificduct021@gmail.com'];

const CONTACT = {
  phone: '(469) 898-9044',
  email: 'info@pacificductpros.com',
  address: '',
};

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Pass it inline to target another database:');
    console.error('  MONGODB_URI="<uri>" node api/scripts/seedContent.js');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let content = await Content.findOne({ key: 'site' });
  if (!content) {
    content = new Content({ key: 'site' });
    console.log('No content document found, creating one');
  }

  if (!content.services || content.services.length === 0) {
    content.services = SERVICES;
    console.log(`Seeded ${SERVICES.length} services`);
  } else {
    // Bring a service list saved before categories existed up to date, without
    // touching prices or descriptions the admin may have edited.
    const renamed = [];
    const categorised = [];

    content.services.forEach((service) => {
      const newTitle = RENAMES[service.title];
      if (newTitle) {
        renamed.push(`${service.title} -> ${newTitle}`);
        service.title = newTitle;
      }

      const known = SERVICES.find((s) => s.title === service.title);
      const category = known ? known.category : service.category || 'Cleaning';
      if (service.category !== category) {
        categorised.push(`${service.title}: ${service.category || '(none)'} -> ${category}`);
        service.category = category;
      }
    });

    console.log(`Kept ${content.services.length} existing services`);
    renamed.forEach((line) => console.log('  renamed  ', line));
    categorised.forEach((line) => console.log('  category ', line));
    if (!renamed.length && !categorised.length) console.log('  already up to date');
  }

  if (!content.contact) content.contact = {};
  if (!content.contact.phone) content.contact.phone = CONTACT.phone;

  // The site now sends from the domain mailbox, so the address shown to
  // customers should match it rather than the Gmail account it replaced.
  if (!content.contact.email || OLD_EMAILS.includes(content.contact.email)) {
    if (content.contact.email && content.contact.email !== CONTACT.email) {
      console.log(`  email    ${content.contact.email} -> ${CONTACT.email}`);
    }
    content.contact.email = CONTACT.email;
  }
  console.log(`Contact: ${content.contact.phone} / ${content.contact.email}`);

  await content.save();
  console.log('Content saved');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
