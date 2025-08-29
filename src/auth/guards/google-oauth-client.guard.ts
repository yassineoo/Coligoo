import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";


@Injectable()
export class GoogleOauthClientGuard extends AuthGuard('google-client') {}