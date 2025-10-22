let PrismaClient;
if (process.env.NODE_ENV === 'production') {
  PrismaClient = require('../../generated/prisma').PrismaClient;
} else {
  PrismaClient = require('../generated/prisma').PrismaClient;
}
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
export default prisma;