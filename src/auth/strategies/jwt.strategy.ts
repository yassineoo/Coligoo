import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtConfig } from "src/config/jwt.config";
import UserPayload from "../types/user-payload.interface";
import { UsersService } from "src/users/users.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly jwtConfig: JwtConfig,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.getJwtSecret(),
    })
  }

  async validate(payload: any) : Promise<UserPayload> {
    const user = await this.usersService.findOne(payload.id)
    if (!user) {
      throw new UnauthorizedException()
    }
    return { userId: payload.id, email: payload.email }
  }
}