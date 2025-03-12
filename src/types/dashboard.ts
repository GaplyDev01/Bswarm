import React from 'react';
import RGL from 'react-grid-layout';

/**
 * Dashboard card option interface
 */
export interface CardOption {
  id: string;
  title: string;
  component: React.ReactNode;
  visible: boolean;
  description?: string;
}

/**
 * Trader profile types
 */
export type TraderProfileType = 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'custom';

/**
 * Trader profile settings
 */
export interface TraderProfile {
  id: TraderProfileType;
  name: string;
  description: string;
  columns: number;
  visibleCards: string[];
  layout?: RGL.Layout[];
}

/**
 * Dashboard preferences interface
 */
export interface DashboardPreferences {
  traderProfile: TraderProfileType;
  columns: number;
  visibleCards: string[];
  timestamp: string;
}

/**
 * Dashboard layout settings
 */
export interface DashboardLayout {
  layout: RGL.Layout[];
  timestamp: string;
} 