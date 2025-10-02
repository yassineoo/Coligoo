import { RegisterDto } from 'src/auth/dto/register.dto';
import { ClientRegisterDto } from 'src/auth/dto/client-register.dto';
import { UserRole } from 'src/common/types/roles.enum';

export class CreateClientUserDto extends ClientRegisterDto {
  role: UserRole;
  // isGoogleUser?: boolean;
  //isAppleUser?: boolean;
  isEmailVerified?: boolean = false;
  imgUrl?: string;
}
