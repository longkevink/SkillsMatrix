import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkillsWidget } from "@/src/components/dashboard/skills-widget";
import type { DashboardData } from "@/src/lib/types";

describe("SkillsWidget", () => {
    const baseShows = [
        { id: "show-1", name: "Nightly Briefing", type: "Network" },
        { id: "show-2", name: "Morning Recap", type: "Streaming" },
    ];
    const singleShow = [{ id: "show-1", name: "Nightly Briefing", type: "Network" }];

    const dataWithAlerts: DashboardData = {
        shows: baseShows,
        resources: [
            {
                id: "resource-a1-active",
                name: "A1 Active",
                role: "A1",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-a1-training",
                name: "A1 Training",
                role: "A1",
                skills: {
                    "show-2": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-a1-na",
                name: "A1 NA",
                role: "A1",
                skills: {
                    "show-1": { status: "NA", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-active",
                name: "TD Active",
                role: "TD",
                skills: {
                    "show-2": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
        ],
    };

    const dataWithoutAlerts: DashboardData = {
        shows: singleShow,
        resources: [
            {
                id: "resource-a1-active-one",
                name: "A1 Active 1",
                role: "A1",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-a1-active-two",
                name: "A1 Active 2",
                role: "A1",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-a1-training-one",
                name: "A1 Training 1",
                role: "A1",
                skills: {
                    "show-1": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-a1-training-two",
                name: "A1 Training 2",
                role: "A1",
                skills: {
                    "show-1": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-active-one",
                name: "TD Active 1",
                role: "TD",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-active-two",
                name: "TD Active 2",
                role: "TD",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-active-three",
                name: "TD Active 3",
                role: "TD",
                skills: {
                    "show-1": { status: "Active", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-training-one",
                name: "TD Training 1",
                role: "TD",
                skills: {
                    "show-1": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-training-two",
                name: "TD Training 2",
                role: "TD",
                skills: {
                    "show-1": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
            {
                id: "resource-td-training-three",
                name: "TD Training 3",
                role: "TD",
                skills: {
                    "show-1": { status: "Training", notes: null },
                },
                controlRoomSkills: {},
            },
        ],
    };

    it("shows counts per position and hides nominal message when there are alerts", () => {
        render(<SkillsWidget data={dataWithAlerts} />);

        expect(screen.queryByText("All Systems Nominal")).toBeNull();

        const a1Row = screen.getByText("A1").closest(".group");
        expect(a1Row).toBeTruthy();
        const a1Within = within(a1Row as HTMLElement);
        // The ready count is prominently displayed
        expect(a1Within.getByText("1", { selector: ".text-lg" })).toBeInTheDocument();

        // Check stacked bar segments using data-testid
        const availableSegment = screen.getByTestId("position-status-a1-available");
        expect(within(availableSegment).getByText("33%")).toBeInTheDocument();
        const trainingSegment = screen.getByTestId("position-status-a1-training");
        expect(within(trainingSegment).getByText("33%")).toBeInTheDocument();
        const naSegment = screen.getByTestId("position-status-a1-na");
        expect(within(naSegment).getByText("33%")).toBeInTheDocument();

        const tdRow = screen.getByText("TD").closest(".group");
        expect(tdRow).toBeTruthy();
        const tdWithin = within(tdRow as HTMLElement);
        expect(tdWithin.getByText("1", { selector: ".text-lg" })).toBeInTheDocument();
        const tdAvailableSegment = screen.getByTestId("position-status-td-available");
        expect(within(tdAvailableSegment).getByText("100%")).toBeInTheDocument();
    });

    it("shows the nominal status message when no alerts exist", () => {
        render(<SkillsWidget data={dataWithoutAlerts} />);
        expect(screen.getByText("All Systems Nominal")).toBeInTheDocument();
    });
});
