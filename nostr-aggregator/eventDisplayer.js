import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import minimist from 'minimist';

const prisma = new PrismaClient();

async function displayEvents(limit, orderBy) {
  // Check orderBy value
  if (orderBy !== 'asc' && orderBy !== 'desc') {
    console.error(
      chalk.red(
        'Invalid order parameter. Must be "asc" or "desc". Using default value "desc".'
      )
    );
    orderBy = 'desc';
  }

  const events = await prisma.aggregation_Event.findMany({
    take: parseInt(limit),
    orderBy: {
      created_at: orderBy,
    },
  });
  events.forEach((event, index) => {
    console.log(chalk.green(`Event ${index + 1}:`));
    console.log(chalk.blue(`ID: ${event.id}`));
    console.log(chalk.blue(`Sig: ${event.sig}`));
    console.log(chalk.blue(`Payload: ${event.payload}`));
    console.log('\n');
  });
}
const args = minimist(process.argv.slice(2));
const amount = args.amount || 20;
const order = args.orderBy || 'desc';

displayEvents(amount, order)
  .catch(e => {
    console.error(chalk.red('Error:', e));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
