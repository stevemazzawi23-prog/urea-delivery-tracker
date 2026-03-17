import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient } from '@trpc/client';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import superjson from 'superjson';

export const trpc = createTRPCReact<any>( );

export function makeClient() {
  return createTRPCClient<any>({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.sp-logistix.com/api/trpc',
      } ),
    ],
  });
}
