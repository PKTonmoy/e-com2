import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Ensures an admin user exists in the database.
 * Creates one if it doesn't exist. This is safe to run on every server start.
 */
const ensureAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'tonmoypramanik17@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '#iamtonmoy';
    const adminName = process.env.ADMIN_NAME || 'PRELUX Admin';

    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            // Update role to admin if not already (in case user signed up as customer first)
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log(`[Admin] Updated ${adminEmail} to admin role`);
            }
            return existingAdmin;
        }

        // Create new admin user
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: 'admin',
            profileComplete: true,
            phone: '',
            address: '',
            city: '',
            country: '',
            postalCode: '',
        });

        console.log(`[Admin] Created admin user: ${adminEmail}`);
        return admin;
    } catch (error) {
        console.error('[Admin] Error ensuring admin user:', error.message);
        // Don't throw - let server continue even if admin creation fails
        return null;
    }
};

export default ensureAdmin;
