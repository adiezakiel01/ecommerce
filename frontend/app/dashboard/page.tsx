"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { analyticsApi, RevenuePoint, RevenueSummary } from "@/lib/api";

function KpiCard({title, value, change, prefix = ""}: {title: string, value: string, change: number | null, prefix?: string}) {
    const isPositive = change !== null && change > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">
                {prefix}{value}
            </p>
            {change !== null && (
                <p className={`text-xs mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
                    {isPositive ? "↑" : "↓"} {Math.abs(change)}% vs last period
                </p>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); 

    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                const [summaryData, revenue] = await Promise.all([
                    analyticsApi.getSummary(30),
                    analyticsApi.getRevenue('day', 90)
                ]);
                setSummary(summaryData);
                setRevenueData(revenue);
            } catch (err) {
                setError("Failed to load dashboard data");
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
            loadDashboard();
        }, []);

    if (loading) {
        return (
        <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading dashboard...</div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="flex items-center justify-center h-full">
            <div className="text-red-500">{error}</div>
        </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Last 30 days vs previous 30 days
                </p>
            </div>

            {summary && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <KpiCard
                        title="Total Revenue"
                        value={`$${summary.current.revenue.toLocaleString()}`}
                        change={summary.changes.revenue}
                    />
                    <KpiCard
                        title="Total Orders"
                        value={summary.current.order_count.toLocaleString()}
                        change={summary.changes.order_count}
                    />
                    <KpiCard
                        title="Avg Order Value"
                        value={`$${summary.current.aov.toFixed(2)}`}
                        change={summary.changes.aov}
                    />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-medium text-gray-700 mb-4">
                    Revenue — last 90 days
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            interval={9}
                            tickFormatter={(val) => val.slice(5)} // show MM-DD only
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                             formatter={(value) => [
                                `$${Number(value ?? 0).toLocaleString()}`,
                                "Revenue",
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={false} // hide dots for cleaner look
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}