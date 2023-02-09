import { FastifyInstance, FastifyRequest } from 'fastify';
import { isUnpaged } from '../../utils/routes';
import { getSchemaForEndpoint } from '@blockfrost/openapi';
import { SQLQuery } from '../../sql';
import * as QueryTypes from '../../types/queries/pools';
import * as ResponseTypes from '../../types/responses/pools';
import { getDbSync } from '../../utils/database';
import { toJSONStream } from '../../utils/string-utils';

async function route(fastify: FastifyInstance) {
  fastify.route({
    url: '/pools/retiring',
    method: 'GET',
    schema: getSchemaForEndpoint('/pools/retiring'),
    handler: async (request: FastifyRequest<QueryTypes.RequestParameters>, reply) => {
      const clientDbSync = await getDbSync(fastify);

      try {
        const unpaged = isUnpaged(request);
        const { rows }: { rows: ResponseTypes.PoolRetire } = unpaged
          ? await clientDbSync.query<QueryTypes.PoolsRetire>(
              SQLQuery.get('pools_retiring_unpaged'),
              [request.query.order],
            )
          : await clientDbSync.query<QueryTypes.PoolsRetire>(SQLQuery.get('pools_retiring'), [
              request.query.order,
              request.query.count,
              request.query.page,
            ]);

        clientDbSync.release();

        if (rows.length === 0) {
          return reply.send([]);
        }

        if (unpaged) {
          // Use of Reply.raw functions is at your own risk as you are skipping all the Fastify logic of handling the HTTP response
          // https://www.fastify.io/docs/latest/Reference/Reply/#raw
          reply.raw.writeHead(200, { 'Content-Type': 'application/json' });
          await toJSONStream(rows, reply.raw);
          return reply;
        } else {
          return reply.send(rows);
        }
      } catch (error) {
        if (clientDbSync) {
          clientDbSync.release();
        }
        throw error;
      }
    },
  });
}

export default route;
