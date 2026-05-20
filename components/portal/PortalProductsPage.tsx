"use client";
import React from "react";

import { useState, useMemo, useEffect } from "react";
import { Search, ArrowRight, Heart, ShoppingBag, Filter, Check, X, Package, Plus } from "lucide-react";
import { togglePortalFavorite } from "@/app/actions/portal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
function addToCart(product: any) {
  const cart = JSON.parse(localStorage.getItem("portal_cart") || "[]");
  const existing = cart.find((i: any) => i.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      uom: product.uom,
      image: product.image
    });
  }
  localStorage.setItem("portal_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}
function ProductCard({
  product,
  onToggleFavorite
}: {
  product: any;
  onToggleFavorite: (id: string) => void;
}) {
  const [isFav, setIsFav] = useState(product.isFavorite);
  const [favLoading, setFavLoading] = useState(false);
  const handleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavLoading(true);
    setIsFav(!isFav);
    await togglePortalFavorite(product.id);
    setFavLoading(false);
    onToggleFavorite(product.id);
  };
  return <Link href={`/portal/products/${product.id}`} className="block">
      {" "}
      <div className="bg-white rounded-sm border border-slate-200 overflow-hidden hover:shadow-sm hover:-translate-y-1 transition-all duration-300 group">
        {" "}
        {/* Image */}{" "}
        <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
          {" "}
          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <Package className="w-12 h-12 text-slate-300" />}{" "}
          {/* Favorite Button */}{" "}
          <button onClick={handleFav} disabled={favLoading} className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors">
            {" "}
            <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-slate-400"}`} />{" "}
          </button>{" "}
          {/* Availability Badge */}{" "}
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${product.isAvailable ? "bg-teal-50 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {" "}
            {product.isAvailable ? "متاح" : "نفذ"}{" "}
          </div>{" "}
        </div>{" "}
        {/* Info */}{" "}
        <div className="p-3">
          {" "}
          <p className="text-[10px] text-slate-400 mb-0.5">
            {product.categoryName}
          </p>{" "}
          <h3 className="text-sm font-bold text-slate-800 leading-tight mb-2 line-clamp-2 min-h-[2.5em]">
            {" "}
            {product.name}{" "}
          </h3>{" "}
          <div className="flex items-end justify-between">
            {" "}
            <div>
              {" "}
              <p className="text-base font-bold text-teal-700">
                {" "}
                {product.price.toFixed(2)}{" "}
                <span className="text-[10px] text-slate-400 font-normal mr-0.5">
                  ج.م
                </span>{" "}
              </p>{" "}
              {product.hasDiscount && product.originalPrice && <p className="text-[11px] text-slate-400 line-through">
                  {" "}
                  {product.originalPrice.toFixed(2)}{" "}
                </p>}{" "}
            </div>{" "}
            <button onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product);
            toast.success(`تمت إضافة ${product.name} للسلة`);
          }} className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm hover:bg-emerald-600 transition-colors active:scale-95">
              {" "}
              <Plus className="w-4 h-4" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </Link>;
}
export function PortalProductsPage({
  products,
  categories,
  user,
  initialCategory,
  initialSearch
}: {
  products: any[];
  categories: any[];
  user: any;
  initialCategory?: string;
  initialSearch?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("portal_cart") || "[]");
        setCartCount(cart.length);
      } catch {
        setCartCount(0);
      }
    };
    updateCount();
    window.addEventListener("cart-updated", updateCount);
    return () => window.removeEventListener("cart-updated", updateCount);
  }, []);
  const filteredProducts = useMemo(() => {
    if (!search && !selectedCategory) return products;
    return products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.toLowerCase().includes(search.toLowerCase()) || p.internalReference?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || p.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId === selectedCategory ? "" : catId);
    setShowFilters(false);
  };
  return <div className="min-h-screen bg-gray-50">
      {" "}
      {/* Header */}{" "}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {" "}
          <Link href="/portal" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            {" "}
            <ArrowRight className="w-4 h-4" />{" "}
          </Link>{" "}
          <h1 className="text-sm font-bold text-slate-800 flex-1">المنتجات</h1>{" "}
          <Link href="/portal/cart" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors relative">
            {" "}
            <ShoppingBag className="w-4 h-4" />{" "}
            {cartCount > 0 && <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {" "}
                {cartCount}{" "}
              </span>}{" "}
          </Link>{" "}
          <button onClick={() => setShowFilters(!showFilters)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showFilters || selectedCategory ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            {" "}
            <Filter className="w-4 h-4" />{" "}
          </button>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {" "}
        {/* Search */}{" "}
        <div className="relative mb-4">
          {" "}
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all placeholder:text-slate-400" />{" "}
          {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {" "}
              <X className="w-4 h-4" />{" "}
            </button>}{" "}
        </div>{" "}
        {/* Category Filter */}{" "}
        {showFilters && <div className="mb-4 bg-white rounded-sm border border-slate-200 p-3 animate-in fade-in slide-in- duration-200">
            {" "}
            <p className="text-xs font-bold text-slate-600 mb-2">
              التصنيفات
            </p>{" "}
            <div className="flex flex-wrap gap-2">
              {" "}
              <button onClick={() => handleCategorySelect("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {" "}
                الكل{" "}
              </button>{" "}
              {categories.map(cat => <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${selectedCategory === cat.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {" "}
                  {cat.name}{" "}
                  <span className={`text-[10px] ${selectedCategory === cat.id ? "text-emerald-200" : "text-slate-400"}`}>
                    {" "}
                    ({cat.productCount}){" "}
                  </span>{" "}
                </button>)}{" "}
            </div>{" "}
          </div>}{" "}
        {/* Active Filter Badge */}{" "}
        {selectedCategory && !showFilters && <div className="mb-3 flex items-center gap-2">
            {" "}
            <span className="px-3 py-1 bg-teal-50 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
              {" "}
              {categories.find(c => c.id === selectedCategory)?.name}{" "}
              <button onClick={() => setSelectedCategory("")} className="hover:text-emerald-900">
                {" "}
                <X className="w-3 h-3" />{" "}
              </button>{" "}
            </span>{" "}
          </div>}{" "}
        {/* Results Count */}{" "}
        <p className="text-[11px] text-slate-400 mb-3">
          {" "}
          {filteredProducts.length} منتج{" "}
        </p>{" "}
        {/* Product Grid */}{" "}
        {filteredProducts.length > 0 ? <div className="grid grid-cols-2 gap-3 pb-6">
            {" "}
            {filteredProducts.map(product => <ProductCard key={product.id} product={product} onToggleFavorite={() => {}} />)}{" "}
          </div> : <div className="flex flex-col items-center justify-center py-20 text-center">
            {" "}
            <Package className="w-16 h-16 text-slate-200 mb-4" />{" "}
            <p className="text-sm text-slate-500 font-medium">لا توجد منتجات</p>{" "}
            <p className="text-xs text-slate-400 mt-1">
              جرب تغيير البحث أو التصنيف
            </p>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}