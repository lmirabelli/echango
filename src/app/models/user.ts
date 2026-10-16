// Contrato para los datos que vienen del formulario de registro
export interface RegisterData {
    nombre: string;
    apellido: string;
    user: string; // username
    email: string;
    ciudad: string;
    password: string;
}

// Contrato para la tabla 'profiles' en Supabase
export interface UserProfile {
    id?: number;              // Autoincremental
    auth_id: string;          // UUID vinculado a auth.users
    nombre: string;
    apellido: string;
    email: string;
    ciudad: string;
    username: string;
    role: 'user' | 'admin';   // Roles permitidos
    created_at?: string;
}