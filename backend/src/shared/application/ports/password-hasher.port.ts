/** Puerto de aplicación: hash de contraseñas (infra: bcrypt). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
