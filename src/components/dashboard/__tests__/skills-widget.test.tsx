import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

afterEach(() => {
    cleanup();
});
import { KpiStrip } from "@/src/components/dashboard/kpi-strip";
import { TrainingPipelineWidget } from "@/src/components/dashboard/training-pipeline-widget";
import { RoleRiskTable } from "@/src/components/dashboard/role-risk-table";
import { ShowHeatmap } from "@/src/components/dashboard/show-heatmap";
import type { DashboardAnalytics } from "@/src/lib/types";

const mockAnalytics: DashboardAnalytics = {
    totalStaff: 10,
    totalShows: 2,
    totalControlRooms: 3,
    activeAssignments: 8,
    trainingAssignments: 4,
    coverageScore: 62,
    openBackfillGaps: 2,
    readyBackfills: 3,
    statusDistribution: {
        active: 8,
        training: 4,
        refresh: 1,
        na: 3,
        red: 0,
        total: 16,
    },
    heatmapData: [
        { showId: "s1", showName: "Nightly Briefing", role: "A1", dominantStatus: "Active", active: 2, training: 1, total: 3 },
        { showId: "s1", showName: "Nightly Briefing", role: "TD", dominantStatus: "Training", active: 1, training: 2, total: 3 },
        { showId: "s2", showName: "Morning Recap", role: "A1", dominantStatus: "Red", active: 0, training: 0, total: 2 },
        { showId: "s2", showName: "Morning Recap", role: "TD", dominantStatus: "Active", active: 3, training: 0, total: 3 },
    ],
    roleRisks: [
        { role: "A1", activeCount: 2, trainingCount: 1, target: 2, deficit: 0, severity: "ok" },
        { role: "TD", activeCount: 1, trainingCount: 2, target: 3, deficit: 2, severity: "critical" },
    ],
    trainingPipeline: [
        { resourceName: "Alice Smith", role: "A1", showName: "Nightly Briefing", status: "Training" },
        { resourceName: "Bob Jones", role: "TD", showName: "Nightly Briefing", status: "Training" }
    ],
    trainingInsights: [],
    uniqueRoles: ["A1", "TD"],
    uniqueShowNames: ["Nightly Briefing", "Morning Recap"],
};

describe("KpiStrip", () => {
    it("renders all 6 KPI tiles with correct values", () => {
        render(<KpiStrip analytics={mockAnalytics} />);

        expect(screen.getByTestId("kpi-strip")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-totalStaff")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-active")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-training")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-coverage")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-gaps")).toBeInTheDocument();
        expect(screen.getByTestId("kpi-backfills")).toBeInTheDocument();

        // Check key values are rendered
        expect(screen.getByText("10")).toBeInTheDocument(); // totalStaff
        expect(screen.getByText("62%")).toBeInTheDocument(); // coverage
    });
});

describe("TrainingPipelineWidget", () => {
    it("renders active training assignments grouped by role", () => {
        render(<TrainingPipelineWidget analytics={mockAnalytics} />);

        expect(screen.getByTestId("training-pipeline")).toBeInTheDocument();
        expect(screen.getByText("2 Active")).toBeInTheDocument();
        expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
});

describe("RoleRiskTable", () => {
    it("renders role risks with correct deficit and severity", () => {
        render(<RoleRiskTable analytics={mockAnalytics} />);

        expect(screen.getByTestId("role-risk-table")).toBeInTheDocument();

        // Check role names
        expect(screen.getByText("A1")).toBeInTheDocument();
        expect(screen.getByText("TD")).toBeInTheDocument();

        // Check TD shows critical severity
        expect(screen.getByText("Critical")).toBeInTheDocument();
        expect(screen.getByText("Covered")).toBeInTheDocument();

        // Check deficit
        expect(screen.getByText("-2")).toBeInTheDocument();

        // Shows count of roles below target
        expect(screen.getByText(/roles below target/)).toBeInTheDocument();
    });
});

describe("ShowHeatmap", () => {
    it("renders a heatmap grid with shows and roles and special formatting", () => {
        render(<ShowHeatmap analytics={mockAnalytics} />);

        expect(screen.getByTestId("show-heatmap")).toBeInTheDocument();
        expect(screen.getByText("Nightly Briefing")).toBeInTheDocument();

        // Active cell shows '2'
        expect(screen.getByText("2")).toBeInTheDocument();

        // Training cell shows '2T'
        expect(screen.getByText("2T")).toBeInTheDocument();

        // Red cell shows '0'
        expect(screen.getByText("0")).toBeInTheDocument();
    });
});
