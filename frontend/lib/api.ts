import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    timeout: 120000,
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
    price: string;
    cost: string;
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
        return response.data;
    }
};

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sql_query?: string;
    data?: Record<string, unknown>[];
    chart_type?: string;
}

export interface ChatApiResponse {
    message: string;
    sql_query?: string;
    data?: Record<string, unknown>[];
    chart_type?: string;
}

export const chatApi = {
    sendMessage: async (
        message: string,
        history: { role: string; content: string }[] = []
    )
        : Promise<ChatApiResponse> => {
        const response = await apiClient.post('/chat/message', {
            message,
            history,
        });
        return response.data;
    },

    getSuggestions: async (): Promise<string[]> => {
        const response = await apiClient.get('/chat/suggestions');
        return response.data.suggestions;
    },
};

export interface ForecastPoint {
    date: string;
    value?: number;
    lower?: number;
    upper?: number;
    actual?: number;
}

export interface ForecastResponse {
    forecast_days: number;
    history_days: number;
    historical: {
        date: string;
        actual: number;
    } [];
    fitted: ForecastPoint[];
    forecast: ForecastPoint[];
    model_info: {
        training_samples: number;
        seasonalities: string[];
    };
}

export const forecastApi = {
    getRevenueForecast: async (
        forecast_days = 30,
        history_days = 365
    ): Promise<ForecastResponse> => {
        const response = await apiClient.get('/forecasting/revenue', {
            params: { 
                forecast_days: forecast_days, 
                history_days: history_days 
            },
        });
        return response.data;
    },
};