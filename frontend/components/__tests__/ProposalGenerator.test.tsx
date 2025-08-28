import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProposalGenerator from '../ProposalGenerator';
import { generateProposal } from '../../lib/api';

vi.mock('../../lib/api', async () => {
  return {
    generateProposal: vi.fn().mockResolvedValue({
      proposal_text: 'Hello client, here is my tailored proposal.',
      pricing_strategy: 'Fixed price with milestones',
      estimated_timeline: '2-3 weeks',
      success_tips: ['Be responsive', 'Share clear requirements'],
    }),
  };
});

const getClipboardMock = () => (globalThis.navigator as any).clipboard;

describe('ProposalGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('restores mode and inputs from localStorage on load', async () => {
    localStorage.setItem(
      'proposal_form_v1',
      JSON.stringify({
        mode: 'manual',
        form: {
          job_description: 'Some valid description',
          user_skills: 'React, FastAPI',
          target_rate: 55,
        },
      })
    );

    render(<ProposalGenerator />);

    // Check fields restored
    const desc = await screen.findByLabelText(/Job description/i);
    expect((desc as HTMLTextAreaElement).value).toContain('Some valid description');

    const skills = screen.getByLabelText(/Your skills/i) as HTMLInputElement;
    expect(skills.value).toBe('React, FastAPI');

    const rate = screen.getByLabelText(/Target hourly rate/i) as HTMLInputElement;
    expect(rate.value).toBe('55');
  });

  it('persists mode and inputs to localStorage when changed', async () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');

    render(<ProposalGenerator />);

    // Switch to manual mode
    const manualTab = screen.getByRole('tab', { name: /manual/i });
    await userEvent.click(manualTab);

    // Type into skills
    const skills = screen.getByLabelText(/Your skills/i);
    await userEvent.type(skills, 'React');

    // Expect localStorage to be written at least once
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  it('shows copy buttons and writes expected text to clipboard', async () => {
    const clipboard = getClipboardMock();
    render(<ProposalGenerator />);

    // Switch to manual mode and fill form
    await userEvent.click(screen.getByRole('tab', { name: /manual/i }));
    await userEvent.type(screen.getByLabelText(/Job description/i), 'A valid long description for the job');
    await userEvent.type(screen.getByLabelText(/Your skills/i), 'React, Tailwind');
    await userEvent.type(screen.getByLabelText(/Target hourly rate/i), '45');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /Generate Proposal/i }));

    // Ensure API call happened (async submit completed)
    await waitFor(() => {
      expect(generateProposal).toHaveBeenCalled();
    });

    // Wait for dialog and click per-section copy buttons
    await waitFor(() => {
      expect(screen.getByText(/Generated Proposal/i)).toBeInTheDocument();
    });

    // Proposal copy
    await userEvent.click(screen.getByRole('button', { name: /^Copy$/ }));
    expect(clipboard.writeText).toHaveBeenCalledWith(
      'Hello client, here is my tailored proposal.'
    );

    // Pricing Strategy copy
    const pricingCopy = screen.getAllByRole('button', { name: /^Copy$/ })[1];
    await userEvent.click(pricingCopy);
    expect(clipboard.writeText).toHaveBeenCalledWith('Fixed price with milestones');

    const timelineCopy = screen.getAllByRole('button', { name: /^Copy$/ })[2];
    await userEvent.click(timelineCopy);
    expect(clipboard.writeText).toHaveBeenCalledWith('2-3 weeks');

    // Copy All Success Tips
    await userEvent.click(screen.getByRole('button', { name: /Copy All/i }));
    expect(clipboard.writeText).toHaveBeenCalledWith(
      'Be responsive\nShare clear requirements'
    );

    // Copy individual tip
    const tipCopyButtons = screen.getAllByRole('button', { name: /^Copy$/ });
    // Next copy buttons correspond to tips; click the last one
    await userEvent.click(tipCopyButtons[tipCopyButtons.length - 1]);
    expect(clipboard.writeText).toHaveBeenLastCalledWith('Share clear requirements');
  });
});
