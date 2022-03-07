import React from 'react';
import { render, screen } from '@testing-library/react';
import { SchedulingWindow } from '../../../Components/Scheduling/SchedulingWindow';


jest.mock("../../../Components/Scheduling/SchedulingHeader", () => {
    return {
        __esModule: true,
        SchedulingHeader: () => {
            return <div data-testid="header"/>
        }
    }
})

jest.mock("../../../Components/Scheduling/SchedulingRender", () => {
    return {
        __esModule: true,
        SchedulingRender: () => {
            return <div data-testid="render"/>
        }
    }
})

jest.mock("../../../Components/Scheduling/SchedulingFilter", () => {
    return {
        __esModule: true,
        SchedulingFilter: () => {
            return <div data-testid="filter"/>
        }
    }
})

describe('SchedulingWindow', () => {
    beforeEach(() => render(< SchedulingWindow />));
    
    it('displays the header, render, and filter', () => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('render')).toBeInTheDocument();
        expect(screen.getByTestId('filter')).toBeInTheDocument();
    })
});