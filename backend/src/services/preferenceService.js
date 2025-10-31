import prisma from '../config/database.js';

export async function getAdminPreferences(adminId) {
  const records = await prisma.adminPreference.findMany({
    where: { adminId }
  });

  return records.reduce((acc, pref) => {
    acc[pref.key] = pref.value;
    return acc;
  }, {});
}

export async function setAdminPreference(adminId, key, value) {
  return prisma.adminPreference.upsert({
    where: {
      adminId_key: {
        adminId,
        key
      }
    },
    update: { value },
    create: {
      adminId,
      key,
      value
    }
  });
}
