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

const CONTACT = {
  phone: '(469) 898-9044',
  email: 'pacificduct021@gmail.com',
  address: '',
};

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in api/.env');
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
    // Fill in the category on services saved before categories existed
    let updated = 0;
    content.services.forEach((service) => {
      if (!service.category) {
        const known = SERVICES.find((s) => s.title === service.title);
        service.category = known ? known.category : 'Cleaning';
        updated += 1;
      }
    });
    console.log(
      updated
        ? `Kept ${content.services.length} existing services, set category on ${updated}`
        : `Kept ${content.services.length} existing services`,
    );
  }

  if (!content.contact || !content.contact.phone) {
    content.contact = { ...CONTACT, ...(content.contact || {}) , phone: CONTACT.phone };
  }
  if (!content.contact.email) content.contact.email = CONTACT.email;
  console.log(`Contact: ${content.contact.phone} / ${content.contact.email}`);

  await content.save();
  console.log('Content saved');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
