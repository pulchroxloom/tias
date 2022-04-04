import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { GenerateButton } from '../../../Components/EmployeeList/GenerateButton';
import contexts from '../../../Components/APIContext';
import API, { CourseBlockWeek } from '../../../modules/API';

jest.mock('../../../modules/API');
jest.mock('../../../Components/APIContext');

describe('GenerateButton', () => {
    it('should say generate schedule', () => {
        render(<GenerateButton genState={0 as any}/>);
        expect(screen.getByText('Generate Schedule')).toBeInTheDocument();
    });

    it('should run the scheduler when clicked', () => {
        const spy = jest.spyOn(API, 'runScheduler');
        render(
            <contexts.employees.Provider value={[[], () => {}]}>
                <GenerateButton genState={[false, () => {}]}/>
            </contexts.employees.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
    });

    it('should change it\'s text while the scheduler runs', () => {
        render(
            <contexts.employees.Provider value={[[], () => {}]}>
                <GenerateButton genState={[false, () => {}]}/>
            </contexts.employees.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should change it\'s text after the scheduler runs', (done) => {
        render(
            <contexts.employees.Provider value={[[], () => {}]}>
                <GenerateButton genState={[false, () => {}]}/>
            </contexts.employees.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        setTimeout(() => {
            expect(screen.getByText('Done generating!')).toBeInTheDocument();
            done();
        }, 100);
    });

    it('should present a warning if a schedule is present', () => {
        const spy = jest.spyOn(window, 'confirm').mockImplementation(() => false);
        render(
            <contexts.loadedSchedule.Provider value={[new Map<string, number[]>([['1', [1, 2]]]), () => {}]}>
                <contexts.employees.Provider value={[[], () => {}]}>
                    <GenerateButton genState={[false, () => {}]}/>
                </contexts.employees.Provider>
            </contexts.loadedSchedule.Provider>
        )

        const button = screen.getByRole('button');
        button.click();
        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
    });

    it('should save the schedule', (done) => {
        const fn = jest.fn();
        render(
            <contexts.loadedSchedule.Provider value={[new Map<string, number[]>(), fn]}>
                <contexts.employees.Provider value={[[], () => {}]}>
                    <GenerateButton genState={[false, () => {}]}/>
                </contexts.employees.Provider>
            </contexts.loadedSchedule.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        setTimeout(() => {
            expect(fn).toHaveBeenCalled();
            done();
        }, 100);
    })

    it('should update the blocks', (done) => {
        const fn = jest.fn();
        render(
            <contexts.blocks.Provider value={[{ Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null} as CourseBlockWeek, fn]}>
                <contexts.employees.Provider value={[[], () => {}]}>
                    <GenerateButton genState={[false, () => {}]}/>
                </contexts.employees.Provider>
            </contexts.blocks.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        setTimeout(() => {
            expect(fn).toHaveBeenCalled();
            done();
        }, 100);
    })

    it('should update the employees', (done) => {
        const fn = jest.fn();
        render(
            <contexts.employees.Provider value={[[], fn]}>
                <GenerateButton genState={[false, () => {}]}/>
            </contexts.employees.Provider>
        );

        const button = screen.getByRole('button');
        button.click();
        setTimeout(() => {
            expect(fn).toHaveBeenCalled();
            done();
        }, 100);
    })
});