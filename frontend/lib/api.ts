import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface RevenuePoint {
    date: string;  // ISO date string
    revenue: number;
    order_count: number;
    avg_order_value: number;
}

export interface RevenueSummary {
    period_days: number;
    current: {
        revenue: number;
        order_count: number;
        avg_order_value: number;
    };
    previous: {
        revenue: number;
        order_count: number;
        avg_order_value: number;
    };
    changes: {
        revenue_pct: number | null;  // null if previous is zero
        order_count_pct: number | null;
        avg_order_value_pct: number | null;
    };
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    cost: number;
    is_active: boolean;
    stock_qty: number;
}

export const analyticsApi = {
    getRevenue: async (granularity = 'day', days = 90): Promise<RevenuePoint[]> => {
        const response = await apiClient.get('/analytics/revenue', {
            params: { granularity, days },
        });
        return response.data.data;
    },

    getSummary: async (days = 30): Promise<RevenueSummary> => {
        const response = await apiClient.get('/analytics/summary', {
            params: { days },
        });
        return response.data;
    },
};  

export const productsApi = {
    getProducts: async (skip = 0, limit = 20): Promise<Product[]> => {
        const response = await apiClient.get('/products', {
            params: { skip, limit },
        });
        return response.data.data;
    }
};