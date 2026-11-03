import type { Request } from 'express';
import { isIP } from 'node:net';

export function getClientIp(req: Request) {
  const flyIp = req.get('Fly-Client-IP');
  return flyIp && isIP(flyIp) ? flyIp : req.ip || null;
}
