import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RadioQuestion } from '../components/RadioQuestion';

describe('RadioQuestion', () => {
    const mockSetAnswer = jest.fn();
    const mockGoNext = jest.fn();

    const defaultProps = {
        questionId: 'q1',
        text: 'What is your favorite color?',
        options: ['Red', 'Blue', 'Green', 'Yellow'],
        answer: '',
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    /**
     * Test 1: Clicking an option calls setAnswer with questionId and value
     */
    it('should call setAnswer with questionId and value when an option is clicked', () => {
        render(<RadioQuestion {...defaultProps} />);

        const blueOption = screen.getByLabelText('Blue');
        fireEvent.click(blueOption);

        expect(mockSetAnswer).toHaveBeenCalledWith('q1', 'Blue');
        expect(mockSetAnswer).toHaveBeenCalledTimes(1);
    });

    /**
     * Test 2: Clicking an option triggers goNext automatically
     */
    it('should call goNext automatically after selecting an option', async () => {
        render(<RadioQuestion {...defaultProps} autoAdvance={true} />);

        const redOption = screen.getByLabelText('Red');
        fireEvent.click(redOption);

        // Verify setAnswer was called first
        expect(mockSetAnswer).toHaveBeenCalledWith('q1', 'Red');

        // Fast-forward the setTimeout delay
        jest.advanceTimersByTime(300);

        // Verify goNext was called after delay
        expect(mockGoNext).toHaveBeenCalledTimes(1);
    });

    /**
     * Test 3: Last question - clicking does not call goNext but marks as answered
     */
    it('should not call goNext when isLastQuestion is true', async () => {
        render(<RadioQuestion {...defaultProps} isLastQuestion={true} />);

        const greenOption = screen.getByLabelText('Green');
        fireEvent.click(greenOption);

        // Verify setAnswer was called (marks as answered)
        expect(mockSetAnswer).toHaveBeenCalledWith('q1', 'Green');

        // Fast-forward all timers
        jest.runAllTimers();

        // Verify goNext was NOT called
        expect(mockGoNext).not.toHaveBeenCalled();
    });

    /**
     * Additional Test: autoAdvance disabled
     */
    it('should not call goNext when autoAdvance is false', () => {
        render(<RadioQuestion {...defaultProps} autoAdvance={false} />);

        const yellowOption = screen.getByLabelText('Yellow');
        fireEvent.click(yellowOption);

        expect(mockSetAnswer).toHaveBeenCalledWith('q1', 'Yellow');

        jest.runAllTimers();

        expect(mockGoNext).not.toHaveBeenCalled();
    });

    /**
     * Additional Test: Accessibility
     */
    it('should have proper ARIA attributes for accessibility', () => {
        render(<RadioQuestion {...defaultProps} />);

        // Check for proper role
        const radioGroup = screen.getByRole('group');
        expect(radioGroup).toBeInTheDocument();

        // Check all options are radio inputs
        const radioInputs = screen.getAllByRole('radio', { hidden: true });
        expect(radioInputs).toHaveLength(4);

        // Check question text is properly labeled
        expect(screen.getByText('What is your favorite color?')).toHaveAttribute(
            'id',
            'question-label-q1'
        );
    });

    /**
     * Additional Test: Disabled state
     */
    it('should not allow interaction when disabled', () => {
        render(<RadioQuestion {...defaultProps} disabled={true} />);

        const blueOption = screen.getByLabelText('Blue');
        fireEvent.click(blueOption);

        // setAnswer should still be called
        expect(mockSetAnswer).toHaveBeenCalled();

        jest.runAllTimers();

        // But goNext should NOT be called
        expect(mockGoNext).not.toHaveBeenCalled();
    });
});
