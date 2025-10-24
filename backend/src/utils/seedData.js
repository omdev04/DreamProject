require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const mongoose = require('mongoose');
const { Admin, Customer, Site, Payment } = require('../models');

/**
 * Seed Database with Sample Data
 */
const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      Customer.deleteMany({}),
      Site.deleteMany({}),
      Payment.deleteMany({})
    ]);
    console.log('✓ Existing data cleared\n');

    // Create Super Admin
    console.log('Creating Super Admin...');
    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'super_admin'
    });
    console.log('✓ Super Admin created:', superAdmin.email);

    // Create Customers
    console.log('\nCreating Customers...');
    const customers = await Customer.create([
      {
        name: 'John Tech Solutions',
        email: 'john@tech.com',
        phone: '+1-555-0101',
        company: 'Tech Solutions Inc',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      {
        name: 'Sarah Digital Agency',
        email: 'sarah@digital.com',
        phone: '+1-555-0102',
        company: 'Digital Agency LLC',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        }
      },
      {
        name: 'Mike E-Commerce',
        email: 'mike@ecommerce.com',
        phone: '+1-555-0103',
        company: 'E-Commerce Pro',
        address: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        }
      }
    ]);
    console.log(`✓ Created ${customers.length} customers`);

    // Create Customer Admins
    console.log('\nCreating Customer Admins...');
    const customerAdmins = await Admin.create([
      {
        name: 'John Doe',
        email: 'john@tech.com',
        password: 'customer123',
        role: 'customer_admin',
        customer_id: customers[0]._id
      },
      {
        name: 'Sarah Smith',
        email: 'sarah@digital.com',
        password: 'customer123',
        role: 'customer_admin',
        customer_id: customers[1]._id
      },
      {
        name: 'Mike Johnson',
        email: 'mike@ecommerce.com',
        password: 'customer123',
        role: 'customer_admin',
        customer_id: customers[2]._id
      }
    ]);
    console.log(`✓ Created ${customerAdmins.length} customer admins`);

    // Create Sites
    console.log('\nCreating Sites...');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const sites = await Site.create([
      {
        customer_id: customers[0]._id,
        domain: 'techsolutions.com',
        name: 'Tech Solutions Website',
        description: 'Corporate website for tech solutions',
        status: 'active',
        paymentAmount: 5000,
        paymentCycleMonths: 3,
        nextPaymentDate: nextMonth,
        lastPaymentDate: twoMonthsAgo,
        currentUptime: 99.8,
        technology: {
          platform: 'WordPress',
          framework: 'React',
          database: 'MySQL'
        }
      },
      {
        customer_id: customers[0]._id,
        domain: 'blog.techsolutions.com',
        name: 'Tech Blog',
        description: 'Company blog',
        status: 'active',
        paymentAmount: 3000,
        paymentCycleMonths: 3,
        nextPaymentDate: nextMonth,
        currentUptime: 100
      },
      {
        customer_id: customers[1]._id,
        domain: 'digitalagency.com',
        name: 'Digital Agency Portfolio',
        description: 'Agency showcase website',
        status: 'active',
        paymentAmount: 6000,
        paymentCycleMonths: 3,
        nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        currentUptime: 98.5
      },
      {
        customer_id: customers[2]._id,
        domain: 'ecommercepro.com',
        name: 'E-Commerce Store',
        description: 'Online store',
        status: 'active',
        paymentAmount: 8000,
        paymentCycleMonths: 3,
        nextPaymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue
        currentUptime: 97.2
      },
      {
        customer_id: customers[2]._id,
        domain: 'app.ecommercepro.com',
        name: 'E-Commerce App',
        description: 'Mobile app backend',
        status: 'suspended',
        paymentAmount: 7000,
        paymentCycleMonths: 3,
        nextPaymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days overdue
        suspensionReason: 'payment_overdue',
        suspendedAt: new Date(),
        currentUptime: 95.0
      }
    ]);
    console.log(`✓ Created ${sites.length} sites`);

    // Create Payments
    console.log('\nCreating Payment Invoices...');
    const payments = [];

    for (const site of sites) {
      const periodStart = new Date(site.nextPaymentDate);
      periodStart.setMonth(periodStart.getMonth() - site.paymentCycleMonths);
      
      const periodEnd = new Date(site.nextPaymentDate);

      // Current period payment - make some upcoming (within 30 days)
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + Math.floor(Math.random() * 25) + 5); // 5-30 days from now
      
      const payment = new Payment({
        site_id: site._id,
        customer_id: site.customer_id,
        amount: site.paymentAmount,
        dueDate: site.status === 'suspended' ? site.nextPaymentDate : dueDate, // Suspended sites use original date
        periodStart,
        periodEnd,
        status: site.status === 'suspended' ? 'overdue' : 'pending'
      });
      await payment.save();
      payments.push(payment);

      // Add a paid payment from previous period if site is active
      if (site.status === 'active' && site.lastPaymentDate) {
        const prevPeriodEnd = new Date(periodStart);
        const prevPeriodStart = new Date(prevPeriodEnd);
        prevPeriodStart.setMonth(prevPeriodStart.getMonth() - site.paymentCycleMonths);

        const paidPayment = new Payment({
          site_id: site._id,
          customer_id: site.customer_id,
          amount: site.paymentAmount,
          dueDate: prevPeriodEnd,
          paidDate: site.lastPaymentDate,
          periodStart: prevPeriodStart,
          periodEnd: prevPeriodEnd,
          status: 'paid',
          verifiedBy: superAdmin._id,
          verifiedAt: site.lastPaymentDate
        });
        await paidPayment.save();
        payments.push(paidPayment);
      }
    }
    console.log(`✓ Created ${payments.length} payment invoices`);

    // Summary
    console.log('\n========================================');
    console.log('✓ Database seeded successfully!');
    console.log('========================================');
    console.log('\n📧 LOGIN CREDENTIALS:');
    console.log('\nSuper Admin:');
    console.log('  Email: admin@company.com');
    console.log('  Password: admin123');
    console.log('\nCustomer Admins:');
    customerAdmins.forEach((admin, i) => {
      console.log(`\n  ${i + 1}. ${admin.name}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Password: customer123`);
    });
    console.log('\n========================================\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
