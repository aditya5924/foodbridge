import { choose } from '../mode';
import { mock } from '../mockAdapter';
import { http } from '../http';

export const summary = choose(
  async () => {
    const [ds, ps] = await Promise.all([
      mock.donations.list(),
      mock.pickups.list()
    ]);

    return {
      listings: ds.length,
      completed: ps.filter(
        p => p.status === 'delivered'
      ).length,
      inProgress: ps.filter(
        p => ['open', 'assigned'].includes(p.status)
      ).length
    };
  },
  () => http('/public/stats')
);