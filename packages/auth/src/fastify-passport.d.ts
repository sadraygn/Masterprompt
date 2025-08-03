declare module 'fastify-passport' {
  import { FastifyPluginAsync } from 'fastify';
  import passport from 'passport';
  
  interface FastifyPassport extends passport.PassportStatic {
    initialize(options?: any): FastifyPluginAsync;
    secureSession(): FastifyPluginAsync;
  }
  
  const fastifyPassport: FastifyPassport;
  export = fastifyPassport;
}