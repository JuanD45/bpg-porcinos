import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Rol } from '../database/entities';

export const IS_PUBLIC = 'isPublic';
export const ROLES_KEY = 'roles';

/** Ruta accesible sin iniciar sesión. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restringe la ruta a los roles indicados. Sin este decorador, cualquier usuario con sesión entra. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

/** Usuario autenticado de la petición actual. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioSesion => ctx.switchToHttp().getRequest().user,
);
