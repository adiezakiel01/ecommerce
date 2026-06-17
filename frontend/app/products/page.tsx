"use client";

import { useEffect, useState } from "react";
import { productsApi, Product, ProductCreate } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ProductsPage() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading]   = useState(true);
    const [skip, setSkip]         = useState(0);
    const [showForm, setShowForm] = useState(false);
    const limit                   = 20;

    const isAdmin = user?.role === "admin";

    const loadProducts = () => {
        setLoading(true);
        productsApi.getProducts(skip, limit)
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skip]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading products...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {products.length} products shown
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Product
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-gray-600 font-medium">SKU</th>
                            <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                            <th className="text-right px-4 py-3 text-gray-600 font-medium">Price</th>
                            <th className="text-right px-4 py-3 text-gray-600 font-medium">Cost</th>
                            <th className="text-right px-4 py-3 text-gray-600 font-medium">Stock</th>
                            <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                    {product.sku}
                                </td>
                                <td className="px-4 py-3 text-gray-900">
                                    {product.name}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900">
                                    ${product.price.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500">
                                    ${product.cost.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-900">
                                    {product.stock_qty}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        product.is_active
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {product.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                    <button
                        onClick={() => setSkip(Math.max(0, skip - limit))}
                        disabled={skip === 0}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-gray-500">
                        Showing {skip + 1}–{skip + products.length}
                    </span>
                    <button
                        onClick={() => setSkip(skip + limit)}
                        disabled={products.length < limit}
                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {showForm && (
                <AddProductModal
                    onClose={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        loadProducts();
                    }}
                />
            )}
        </div>
    );
}

function AddProductModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState<ProductCreate>({
        sku: "",
        name: "",
        price: 0,
        cost: 0,
        stock_qty: 0,
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await productsApi.createProduct(form);
            onCreated();
        } catch (err) {
            console.error(err);
            setError("Failed to create product. Check the fields and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Product</h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">SKU</label>
                        <input
                            type="text"
                            value={form.sku}
                            onChange={(e) => setForm({ ...form, sku: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Price</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Cost</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.cost}
                                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Stock</label>
                            <input
                                type="number"
                                value={form.stock_qty}
                                onChange={(e) => setForm({ ...form, stock_qty: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                        >
                            {submitting ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}