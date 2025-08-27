import { supabase, User, Customer, Booking } from '../lib/supabase';

export const dbService = {
  // Authentication
  async register(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
    try {
      console.log('Registering user with Supabase:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Supabase registration error:', error);
        throw error;
      }
      
      console.log('User registered successfully:', data);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  async login(email: string, password: string): Promise<User | null> {
    try {
      console.log('Logging in user:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Login error:', error);
        throw new Error('Invalid credentials');
      }

      if (!data) {
        throw new Error('User not found');
      }
      
      console.log('User logged in successfully:', data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }
};