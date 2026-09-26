import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectDataSource() private dataSource: DataSource,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const tokenUser = request.user;
        if (!tokenUser?.sub) {
            return false;
        }

        const dbUser = await this.dataSource.getRepository(User).findOne({
            where: { id: tokenUser.sub },
            select: ['id', 'role', 'isBranchRepresentative', 'isBanned'],
        });

        if (!dbUser || dbUser.isBanned) {
            return false;
        }

        request.user = {
            ...tokenUser,
            role: dbUser.role,
            isBranchRepresentative: dbUser.isBranchRepresentative,
        };

        return requiredRoles.some((role) => dbUser.role === role);
    }
}
