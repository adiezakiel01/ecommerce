"use client";

import { useEffect, useState } from "react";
import {
    ComposedChart, Line, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { forecastApi, ForecastResponse } from "@/lib/api";

export default function ForecastingPage() {
    const [data, setData]       = useState<ForecastResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        forecastApi.getRevenueForecast(30, 365)
            .then(setData)
            .catch(() => setError("Failed to load forecast. Is the backend running?"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
                <p className="text-sm text-gray-500">
                    Fitting Prophet model... (~15 seconds)
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    // Merge historical actuals + fitted values into one series for the chart
    const fittedMap = new Map(data.fitted.map(f => [f.date, f]));

    const historicalSeries = data.historical.map(h => ({
        date:   h.date.slice(5),  // show MM-DD only
        actual: h.actual,
        fitted: fittedMap.get(h.date)?.value ?? null,
    }));

    // Future forecast points
    const forecastSeries = data.forecast.map(f => ({
        date:    f.date.slice(5),
        value:   f.value,
        lower:   f.lower,
        upper:   f.upper,
    }));

    // Combine for single chart — null values create a gap between sections
    const chartData = [
        ...historicalSeries,
        // Bridge point — connects historical to forecast
        {
            date:   data.historical[data.historical.length - 1]?.date.slice(5),
            actual: data.historical[data.historical.length - 1]?.actual,
            value:  data.forecast[0]?.value,
            lower:  data.forecast[0]?.lower,
            upper:  data.forecast[0]?.upper,
        },
        ...forecastSeries,
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">
                    Revenue Forecast
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {data.forecast_days}-day forecast trained on{" "}
                    {data.model_info.training_samples} days of data
                </p>
            </div>

            {/* Model info cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Forecast horizon</p>
                    <p className="text-xl font-semibold text-gray-900">
                        {data.forecast_days} days
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Training data</p>
                    <p className="text-xl font-semibold text-gray-900">
                        {data.model_info.training_samples} days
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500 mb-1">Seasonalities</p>
                    <p className="text-xl font-semibold text-gray-900 capitalize">
                        {data.model_info.seasonalities.join(", ")}
                    </p>
                </div>

                {/* Predicted revenue range */}
                <div className="col-span-3 bg-violet-50 rounded-xl border border-violet-100 p-4">
                    <p className="text-xs text-violet-600 mb-1">
                        Predicted revenue — next {data.forecast_days} days
                    </p>
                    <p className="text-2xl font-semibold text-violet-900">
                        $
                        {data.forecast
                            .reduce((sum, f) => sum + (f.value ?? 0), 0)
                            .toLocaleString("en-US", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                    </p>
                    <p className="text-xs text-violet-500 mt-0.5">
                        Range: $
                        {data.forecast
                            .reduce((sum, f) => sum + (f.lower ?? 0), 0)
                            .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        {" – "}$
                        {data.forecast
                            .reduce((sum, f) => sum + (f.upper ?? 0), 0)
                            .toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </p>
                </div>
            </div>

            {/* Main forecast chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">
                Actual vs Forecast
            </h2>
            {/* Custom legend */}
            <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                    <svg width="24" height="12">
                        <line x1="0" y1="6" x2="24" y2="6"
                            stroke="#7c3aed" strokeWidth="2"/>
                    </svg>
                    <span className="text-xs text-gray-500">Actual revenue</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg width="24" height="12">
                        <line x1="0" y1="6" x2="24" y2="6"
                            stroke="#7c3aed" strokeWidth="2"
                            strokeDasharray="6 3"/>
                    </svg>
                    <span className="text-xs text-gray-500">Forecast</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-3 rounded-sm bg-violet-100 border border-violet-200"/>
                    <span className="text-xs text-gray-500">80% confidence</span>
                </div>
            </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">
            Shaded area = 80% confidence interval
        </p>

                <ResponsiveContainer width="100%" height={380}>
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            interval={6}
                        />
                        <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            formatter={(value: any, name: any) => [
                                `$${Number(value ?? 0).toLocaleString()}`,
                                String(name),
                            ]}
                        />
                        

                        {/* Confidence interval — shaded area */}
                        <Area
                            type="monotone"
                            dataKey="upper"
                            fill="#ede9fe"
                            stroke="none"
                            name="Upper bound"
                            legendType="none"
                        />
                        <Area
                            type="monotone"
                            dataKey="lower"
                            fill="#ffffff"
                            stroke="none"
                            name="Lower bound"
                            legendType="none"
                        />

                        {/* Actual revenue — solid purple line */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            dot={false}
                            name="Actual revenue"
                            connectNulls={false}
                        />

                        {/* Forecast — dashed line */}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            dot={false}
                            name="Forecast"
                            connectNulls={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}