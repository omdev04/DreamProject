require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

/**
 * Reset admin password utility
 * This script helps reset passwords for admin accounts
 */
const resetPassword = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get email and new password from command line arguments
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('Usage: node reset-admin-password.js <email> <new-password>');
      console.log('\nExample:');
      console.log('  node reset-admin-password.js admin@company.com admin123');
      console.log('  node reset-admin-password.js user@example.com newpassword123');
      console.log('\nOr run without arguments to reset the super admin to default:');
      console.log('  node reset-admin-password.js');
      
      // If no arguments, reset super admin to default
      console.log('\n🔧 Resetting super admin to default credentials...');
      const superAdmin = await Admin.findOne({ role: 'super_admin' });
      
      if (!superAdmin) {
        console.log('❌ No super admin found. Creating new one...');
        await Admin.create({
          name: 'Super Admin',
          email: 'admin@company.com',
          password: 'admin123',
          role: 'super_admin',
          isActive: true
        });
        console.log('✅ Super admin created!');
        console.log('   Email: admin@company.com');
        console.log('   Password: admin123');
      } else {
        superAdmin.password = 'admin123';
        await superAdmin.save();
        console.log('✅ Super admin password reset!');
        console.log('   Email:', superAdmin.email);
        console.log('   Password: admin123');
      }
      
      process.exit(0);
    }

    // Find admin by email
    console.log(`Looking for admin: ${email}`);
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log(`❌ Admin not found with email: ${email}`);
      console.log('\nAvailable admins:');
      const allAdmins = await Admin.find({}, 'email name role');
      allAdmins.forEach(a => {
        console.log(`  - ${a.email} (${a.name}) [${a.role}]`);
      });
      process.exit(1);
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password reset successful!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   New Password:', newPassword);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetPassword();
