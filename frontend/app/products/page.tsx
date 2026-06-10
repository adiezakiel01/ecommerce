"use client";

import { useEffect, useState } from "react";
import { productsApi, Product } from "@/lib/api";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading]   = useState(true);
    const [skip, setSkip]         = useState(0);
    const limit                   = 20;

    useEffect(() => {
        productsApi.getProducts(skip, limit)
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
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
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Products</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {products.length} products shown
                </p>
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

                {/* Pagination */}
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
        </div>
    );
}