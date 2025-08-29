import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "src/users/users.service";


@Injectable()
export class BlockedUserGuard implements CanActivate {
    constructor(
        private readonly usersService: UsersService
    ) {}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = await this.usersService.findOne(request.user.userId);
        if(user?.blocked === true) {
            throw new UnauthorizedException("Your account has been blocked");
        }
        return user && user.blocked === false;
    }
}