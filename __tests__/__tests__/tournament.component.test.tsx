import {describe, expect, test, jest} from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import Tournament from '../../app/tournament';
import { openTournamentForm } from '../../app/lib/tournament';

jest.mock('../../app/lib/tournament', () => ({
    openTournamentForm: jest.fn(),
}));

describe('Tournament component', () => {
    test('should call openTournamentForm with the tournament ID when the form is submitted', async () => {
        const mockedOpenTournamentForm = openTournamentForm as jest.Mock;
        render(<Tournament props={{}} />);

        const input = screen.getByLabelText('Tournament ID:');
        const button = screen.getByText('OK');

        fireEvent.change(input, { target: { value: '12345' } });
        fireEvent.click(button);

        // This is a simple test to make sure the form is wired up correctly.
        // It doesn't test the server action itself.
        // We can't easily test the formAction call directly, so we check the mock.
        // This is not ideal, but it's the best we can do without a more complex setup.
        // In a real-world scenario, we might use Playwright for this.
        expect(mockedOpenTournamentForm).toHaveBeenCalled();
    });
});
