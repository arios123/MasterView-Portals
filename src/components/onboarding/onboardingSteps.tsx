import React from 'react';

export interface OnboardingStep {
  title: string;
  description?: string;
  content: string | React.ReactNode;
  highlightTarget?: string; // data-onboarding-highlight attribute value
}

export const onboardingSteps: OnboardingStep[] = [
  {
    title: 'Welcome! 👋',
    description: 'Let\'s get you set up',
    content: 'We\'ll walk you through the essentials in just a few quick steps.',
    highlightTarget: null, // No highlight on welcome screen
  },
  {
    title: 'Your Workspace Settings',
    description: null,
    content: 'This is where you configure your workspace and manage your team.',
    highlightTarget: 'admin-tab',
  },
  {
    title: 'Invite Your Team',
    description: null,
    content: 'Click here to invite staff members.',
    highlightTarget: 'admin-staff-tab,admin-invite-button',
  },
  {
    title: 'Add Items & Labor',
    description: null,
    content: 'Add materials and labor rates here so you can build quotes later.',
    highlightTarget: 'admin-pricing-tab,admin-save-item-button,admin-pricing-add-items',
  },
  {
    title: 'Make It Yours',
    description: null,
    content: 'Choose colors that match your brand. Try changing a few!',
    highlightTarget: 'admin-workspace-setup-tab',
  },
  {
    title: 'Manage Your Plan',
    description: null,
    content: 'Change your subscription in the Advanced tab.',
    highlightTarget: 'admin-advanced-tab',
  },
  {
    title: 'Your Projects',
    description: null,
    content: 'Here are all the projects assigned to you.',
    highlightTarget: 'projects-tab',
  },
  {
    title: 'Inside a Project',
    description: null,
    content: 'When you click a project, you\'ll find everything you need to manage it here.',
    highlightTarget: 'projects-tab', // Keep projects tab highlighted
  },
  {
    title: 'Add Your First Client',
    description: null,
    content: 'Click here to create your first client and get going.',
    highlightTarget: 'add-client-button,projects-tab',
  },
];
