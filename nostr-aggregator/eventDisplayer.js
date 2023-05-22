import { PrismaClient } from '@prisma/client';
import chalk from 'chalk';
import minimist from 'minimist';

const prisma = new PrismaClient();

const argv = minimist(process.argv.slice(2), {
  default: {
    amount: 20,
    orderBy: 'asc',
    keyword: '',
  },
  alias: {
    a: 'amount',
    o: 'orderBy',
    k: 'keyword',
  },
});

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
    where: {
      payload: {
        contains: argv.keyword,
      },
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

const amount = argv.amount || 20;
const order = argv.orderBy || 'desc';

displayEvents(amount, order)
  .catch(e => {
    console.error(chalk.red('Error:', e));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
