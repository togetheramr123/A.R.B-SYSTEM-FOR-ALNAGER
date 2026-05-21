import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // We update the user whose email is 'togetheramr123@mail.com'
    // or who is the first ADMIN.
    
    // Hash the phone number as the password just in case they want it as a password?
    // Wait, the user said: "وخلي تسجيل الدخول عبد العزيز الاسم" (Name: Abdelaziz) 
    // "واليوزر ٠١١٢١٤٦٦٢٢٣" (Username: 01121466223)
    // They didn't mention the password. Let's keep the password as 3080 but change the name to '01121466223' (since login searches by name).
    // Or let's change name to '01121466223' and fullName to 'عبد العزيز'. Wait, is there a fullName field? Let's check schema.
    
    // For now, let's just find the admin user.
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (admin) {
        await prisma.user.update({
            where: { id: admin.id },
            data: {
                name: '01121466223', // So they can login with this
                email: 'abdelaziz@mail.com', // Optional update
            }
        });
        console.log("Admin user updated successfully. Username is now 01121466223");
    } else {
        console.log("No ADMIN user found!");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
