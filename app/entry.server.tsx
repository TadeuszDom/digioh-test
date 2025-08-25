import type {AppLoadContext} from '@shopify/remix-oxygen';
import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: AppLoadContext,
) {


  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },

    defaultSrc: [
      "'self'",
      '*.lightboxcdn.com',
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      '*.lightboxcdn.com',
      'http://localhost:3000',
      'https://cdn.shopify.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      '*.lightboxcdn.com',
      'https://cdn.shopify.com',
      'https://fonts.cdnfonts.com',
      'http://www.revivalrugs.com',
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    connectSrc: [
      "'self'",
      '*.lightboxcdn.com',
      'https://revivalrugs.com',
      'http://localhost:3000',
    ],
    fontSrc: [
      "'self'",
      'data:',
      '*.lightboxcdn.com',
      'http://localhost:3000',
      'https://www.revivalrugs.com',
      'https://revivalrugs.com',
      'https://cdn.shopify.com',
    ],
    frameSrc: [
      "'self'",
      '*.lightboxcdn.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      '*.lightboxcdn.com',
      'https://cdn.shopify.com',
      'http://www.revivalrugs.com',
      'https://www.revivalrugs.com',
      'https://www.revivalrugs.com/cdn/',
      'http://localhost:3000',
    ],
    mediaSrc: [
      "'self'",
      'data:',
      'blob:',
      '*.lightboxcdn.com',
      'https://cdn.shopify.com',
      'https://www.revivalrugs.com',
    ],
    workerSrc: ["'self'", 'blob:'],
    childSrc: ['blob:', '*.lightboxcdn.com'],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
