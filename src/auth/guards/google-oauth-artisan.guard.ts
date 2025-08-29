import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";


@Injectable()
export class GoogleOauthArtisanGuard extends AuthGuard('google-artisan') {}