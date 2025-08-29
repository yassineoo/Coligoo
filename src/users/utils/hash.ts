import * as bcrypt from 'bcryptjs';

export class Hash {
    static hash(password: string) : string {
        return bcrypt.hash(password, 10);
    }

    static compare(password: string, hash: string) : boolean {
        return bcrypt.compare(password, hash);
    }
}