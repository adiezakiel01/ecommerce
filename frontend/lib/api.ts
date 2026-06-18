import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
    },
});

const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => {
    if (typeof window == 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status == 401) {
            clearToken();
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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

export interface ProductCreate {
    sku: string;
    name: string;
    price: number;
    cost: number;
    stock_qty: number;
}
export interface ProductUpdate {
    name?: string;
    description?: string;
    price?: number;
    cost?: number;
    stock_qty?: number;
    is_active?: boolean;
}

export const productsApi = {
    getProducts: async (
        skip = 0,
        limit = 20,
        search?: string,
        isActive?: boolean
    ): Promise<Product[]> => {
        const response = await apiClient.get('/products', {
            params: {
                skip,
                limit,
                ...(search ? { search } : {}),
                ...(isActive !== undefined ? { is_active: isActive } : {}),
            },
        });
        return response.data;
    },

    createProduct: async (product: ProductCreate): Promise<Product> => {
        const response = await apiClient.post('/products/', product);
        return response.data;
    },

    updateProduct: async (id: string, product: ProductUpdate): Promise<Product> => {
        const response = await apiClient.patch(`/products/${id}`, product);
        return response.data;
    },
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

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    username: string;
    role: string;
}

export interface CurrentUser {
    id: number;
    username: string;
    role: string;
    is_active: boolean;
}

export const authApi = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', { username, password });
        return response.data;
    },

    register: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/register', { username, password });
        return response.data;
    },

    getMe: async (): Promise<CurrentUser> => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    logout: (): void => {
        clearToken();
    },
};