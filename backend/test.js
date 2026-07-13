const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function test() {
  try {
    const user = await prisma.user.findFirst({ where: { profile_picture: { not: null } } });
    if (!user) {
      console.log('No user with profile picture found.');
      return;
    }
    console.log('Found user:', user.id, user.profile_picture);

    const filePath = path.join(__dirname, 'src/controllers', '../../', user.profile_picture);
    console.log('File path:', filePath);
    
    // Simulate what the controller does
    if (fs.existsSync(filePath)) {
      console.log('File exists, simulating unlink');
      try {
        // fs.unlinkSync(filePath); 
        console.log('Unlink would succeed');
      } catch(e) {
        console.log('Unlink failed:', e);
      }
    } else {
      console.log('File does NOT exist');
    }

    // Try creating notification to see if it throws
    await prisma.notification.create({
      data: {
        user_id: user.id,
        message: 'Test notification',
        type: 'admin_action'
      }
    });
    console.log('Notification created successfully');

  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
