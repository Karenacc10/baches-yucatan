import prisma from '../utils/prisma';
import { hashPassword } from '../utils/helpers';

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.worker.findUnique({
      where: { email: 'admin@baches-yucatan.com' }
    });

    if (existingAdmin) {
      console.log('❌ Admin user already exists');
      return;
    }

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    
    const admin = await prisma.worker.create({
      data: {
        role: 'admin',
        email: 'admin@baches-yucatan.com',
        passwordHash: adminPassword,
        name: 'Administrador',
        lastname: 'Sistema',
        secondLastname: 'Baches',
        badgeNumber: 'ADMIN001',
        rank: 'Administrador General',
        status: 'active',
        specialization: ['Gestión de sistemas', 'Administración'],
        languagesSpoken: ['Español', 'Inglés'],
        notes: 'Usuario administrador del sistema de gestión de baches'
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@baches-yucatan.com');
    console.log('🔑 Password: admin123');
    console.log('👤 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
createAdminUser();