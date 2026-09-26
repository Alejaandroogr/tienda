import { createContext } from 'react';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  iniciarSesion: (usuario: Usuario) => void;
  cerrarSesion: () => void;
}

export const AuthContext =
  createContext<AuthContextType | undefined>(undefined);