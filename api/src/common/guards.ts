import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Rol } from '../database/entities';
import { IS_PUBLIC, ROLES_KEY } from './auth.decorators';

/** Exige un JWT válido en todas las rutas, salvo las marcadas con @Public(). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const esPublica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;
    return super.canActivate(context);
  }
}

/** Verifica que el rol del usuario esté entre los permitidos por @Roles(). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const user = context.switchToHttp().getRequest().user;
    if (user && roles.includes(user.rol)) return true;
    throw new ForbiddenException('Tu rol no tiene permiso para esta acción.');
  }
}
