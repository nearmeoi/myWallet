import {
  MoreHorizontal, Target, Home, Tag, Palette, User, Settings,
  Briefcase, Gift, Utensils, Coffee, Car, Bus, Plane, Bike,
  ShoppingCart, CreditCard, ShoppingBag, Smartphone, Wifi, Zap, Droplet,
  Heart, Activity, Gamepad, Music, Clapperboard, Ticket,
  Book, GraduationCap, Baby, Dog, Cat, Shirt, Scissors, Hammer, Smile,
  Sun, Moon, Umbrella
} from 'lucide-react';

// Available Icons
export const AVAILABLE_ICONS = {
  // General
  MoreHorizontal, Target, Home, Tag, Palette, User, Settings,
  // Income/Work
  Briefcase, Gift,
  // Food & Drink
  Utensils, Coffee,
  // Transport
  Car, Bus, Plane, Bike,
  // Shopping & Bills
  ShoppingCart, CreditCard, Bag: ShoppingBag,
  // Utilities & Tech
  Smartphone, Wifi, Zap, Droplet,
  // Health
  Heart, Activity,
  // Entertainment
  Gamepad, Music, Clapperboard, Ticket,
  // Education
  Book, GraduationCap,
  // Family & Pets
  Baby, Dog, Cat,
  // Lifestyle
  Shirt, Scissors, Hammer, Smile,
  // Nature
  Sun, Moon, Umbrella
};

// Preset Colors
export const PRESET_COLORS = [
  '#D4F7E6', '#FEF9C3', '#BBEFFA', '#E0CCF8', '#F8D4E3',
  '#FFC0C0', '#E5E7EB', '#F3F4F6', '#FBBF24', '#A78BFA'
];

// Default Categories
export const DEFAULT_CATEGORIES = [
  { id: 'salary', name: 'Gaji', icon: 'Briefcase', bg: '#D4F7E6', type: 'income', isDefault: true },
  { id: 'gift', name: 'Hadiah', icon: 'Gift', bg: '#FFC0C0', type: 'income', isDefault: true },
  { id: 'other_income', name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6', type: 'income', isDefault: true },
  { id: 'food', name: 'Makanan', icon: 'Utensils', bg: '#FEF9C3', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'Car', bg: '#BBEFFA', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Belanja', icon: 'ShoppingCart', bg: '#E0CCF8', type: 'expense', isDefault: true },
  { id: 'coffee', name: 'Kopi', icon: 'Coffee', bg: '#F8D4E3', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Tagihan', icon: 'CreditCard', bg: '#E5E7EB', type: 'expense', isDefault: true },
  { id: 'other_expense', name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6', type: 'expense', isDefault: true }
];
