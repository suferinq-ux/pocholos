'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, TrendingUp, Search, BarChart3, PieChart as PieChartIcon,
    DollarSign, Package, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { obtenerVentasPorRango } from '@/lib/reportes';
import { procesarAnaliticas, type ResumenAnaliticas, type AnaliticaProducto } from '@/lib/analiticas';
import type { Venta } from '@/lib/database.types';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type TipoRango = 'dia' | 'rango';

export default function AnaliticasPage() {
    const [tipoRango, setTipoRango] = useState<TipoRango>('rango');
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
    const [fechaInicio, setFechaInicio] = useState(startOfMonth(new Date()));
    const [fechaFin, setFechaFin] = useState(new Date());
    const [mesCalendario, setMesCalendario] = useState(new Date());
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [seleccionandoRango, setSeleccionandoRango] = useState<'inicio' | 'fin'>('inicio');

    const [ventas, setVentas] = useState<Venta[]>([]);
    const [resumen, setResumen] = useState<ResumenAnaliticas | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Sort logic
    const [sortField, setSortField] = useState<'nombre' | 'tipo' | 'cantidadVendida' | 'ingresosGenerados'>('ingresosGenerados');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const rangosRapidos = [
        { label: 'Hoy', action: () => { setTipoRango('dia'); setFechaSeleccionada(new Date()); } },
        { label: 'Ayer', action: () => { setTipoRango('dia'); setFechaSeleccionada(subDays(new Date(), 1)); } },
        { label: 'Esta semana', action: () => { 
            setTipoRango('rango'); 
            setFechaInicio(startOfWeek(new Date(), { weekStartsOn: 1 })); 
            setFechaFin(new Date()); 
        }},
        { label: 'Este mes', action: () => { 
            setTipoRango('rango'); 
            setFechaInicio(startOfMonth(new Date())); 
            setFechaFin(new Date()); 
        }},
        { label: 'Mes pasado', action: () => { 
            const mesAnterior = subMonths(new Date(), 1);
            setTipoRango('rango'); 
            setFechaInicio(startOfMonth(mesAnterior)); 
            setFechaFin(endOfMonth(mesAnterior)); 
        }},
    ];

    const COLORS = ['#C8102E', '#F2C94C', '#5A3E2B', '#10B981', '#3B82F6', '#8B5CF6'];

    useEffect(() => {
        cargarDatos();
    }, [fechaSeleccionada, fechaInicio, fechaFin, tipoRango]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            let inicio: string, fin: string;
            if (tipoRango === 'dia') {
                inicio = format(fechaSeleccionada, 'yyyy-MM-dd');
                fin = inicio;
            } else {
                inicio = format(fechaInicio, 'yyyy-MM-dd');
                fin = format(fechaFin, 'yyyy-MM-dd');
            }

            const ventasData = await obtenerVentasPorRango(inicio, fin);
            setVentas(ventasData);
            setResumen(procesarAnaliticas(ventasData));
            
        } catch (error) {
            console.error('Error al cargar analíticas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Funciones del calendario
    const nextMonth = () => setMesCalendario(addMonths(mesCalendario, 1));
    const prevMonth = () => setMesCalendario(subMonths(mesCalendario, 1));
    const addMonths = (date: Date, amount: number) => {
        const result = new Date(date);
        result.setMonth(result.getMonth() + amount);
        return result;
    };
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), day);
        if (tipoRango === 'dia') {
            setFechaSeleccionada(clickedDate);
            setMostrarCalendario(false);
        } else {
            if (seleccionandoRango === 'inicio') {
                setFechaInicio(clickedDate);
                if (clickedDate > fechaFin) setFechaFin(clickedDate);
                setSeleccionandoRango('fin');
            } else {
                if (clickedDate < fechaInicio) {
                    setFechaInicio(clickedDate);
                    setFechaFin(fechaInicio);
                } else {
                    setFechaFin(clickedDate);
                }
                setSeleccionandoRango('inicio');
                setMostrarCalendario(false);
            }
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(mesCalendario);
        const firstDay = getFirstDayOfMonth(mesCalendario);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), i);
            let isSelected = false, isStart = false, isEnd = false, isInRange = false;
            if (tipoRango === 'dia') {
                isSelected = isSameDay(currentDate, fechaSeleccionada);
            } else {
                isStart = isSameDay(currentDate, fechaInicio);
                isEnd = isSameDay(currentDate, fechaFin);
                isInRange = currentDate >= fechaInicio && currentDate <= fechaFin;
            }
            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={`h-10 w-full rounded-full flex items-center justify-center text-sm transition-all
                        ${isSelected || isStart || isEnd ? 'bg-pocholo-red text-white font-bold shadow-md' : ''}
                        ${isInRange && !isStart && !isEnd ? 'bg-pocholo-red/20 text-pocholo-red' : ''}
                        ${!isSelected && !isStart && !isEnd && !isInRange ? 'text-slate-700 hover:bg-slate-100' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('desc'); }
    };

    const getTipoLabel = (tipo: string) => {
        switch(tipo) {
            case 'pollo': return 'Platos/Pollo';
            case 'bebida': return 'Bebidas';
            case 'complemento': return 'Complementos';
            case 'promocion': return 'Promociones';
            default: return 'Otros';
        }
    };

    // Memoized sorted and filtered products
    const processedProducts = useMemo(() => {
        if (!resumen) return [];
        let filtered = resumen.productos;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.nombre.toLowerCase().includes(q) || getTipoLabel(p.tipo).toLowerCase().includes(q));
        }
        return filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [resumen, sortField, sortDirection, searchQuery]);

    // Data for charts
    const chartDataCategorias = useMemo(() => {
        if (!resumen) return [];
        const cats = { pollo: 0, bebida: 0, complemento: 0, promocion: 0, desconocido: 0 };
        resumen.productos.forEach(p => cats[p.tipo] += p.ingresosGenerados);
        return [
            { name: 'Pollos/Platos', value: cats.pollo },
            { name: 'Bebidas', value: cats.bebida },
            { name: 'Complementos', value: cats.complemento },
            { name: 'Promociones', value: cats.promocion },
        ].filter(d => d.value > 0);
    }, [resumen]);

    const chartDataTopProductos = useMemo(() => {
        if (!resumen) return [];
        return [...resumen.productos]
            .sort((a, b) => b.ingresosGenerados - a.ingresosGenerados)
            .slice(0, 5)
            .map(p => ({
                name: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
                ingresos: p.ingresosGenerados,
                cantidad: p.cantidadVendida
            }));
    }, [resumen]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-8 lg:ml-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <PieChartIcon className="text-pocholo-red" size={32} />
                            Analíticas de Productos
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Análisis detallado de ingresos por producto vendido
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setMostrarCalendario(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:border-pocholo-red hover:text-pocholo-red transition-colors w-full sm:w-auto font-medium shadow-sm"
                        >
                            <Calendar size={20} />
                            <span className="whitespace-nowrap">
                                {tipoRango === 'dia'
                                    ? format(fechaSeleccionada, "d 'de' MMMM, yyyy", { locale: es })
                                    : `${format(fechaInicio, "d MMM", { locale: es })} - ${format(fechaFin, "d MMM", { locale: es })}`
                                }
                            </span>
                        </button>
                    </div>
                </div>

                {/* Filtros rápidos */}
                <div className="flex flex-wrap gap-2">
                    {rangosRapidos.map((rango, i) => (
                        <button
                            key={i}
                            onClick={rango.action}
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-pocholo-red hover:border-pocholo-red hover:bg-red-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            {rango.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pocholo-red"></div>
                    </div>
                ) : !resumen || resumen.productos.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                        <PieChartIcon className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-xl font-medium text-slate-700 mb-2">Sin datos disponibles</h3>
                        <p className="text-slate-500">No hay ventas registradas en el rango de fechas seleccionado.</p>
                    </div>
                ) : (
                    <>
                        {/* Tarjetas de Resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-slate-100 transform group-hover:scale-110 transition-transform"><DollarSign size={80}/></div>
                                <h3 className="text-slate-500 text-sm font-medium mb-1 relative z-10">Total Generado en Productos</h3>
                                <p className="text-3xl font-bold text-slate-800 relative z-10">S/ {resumen.totalIngresos.toFixed(2)}</p>
                            </motion.div>
                            
                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-slate-100 transform group-hover:scale-110 transition-transform"><Package size={80}/></div>
                                <h3 className="text-slate-500 text-sm font-medium mb-1 relative z-10">Producto Estrella</h3>
                                <p className="text-2xl font-bold text-pocholo-red truncate relative z-10">
                                    {resumen.productoEstrella?.nombre || '-'}
                                </p>
                                <p className="text-sm font-medium text-slate-600 mt-1 relative z-10">Generó S/ {resumen.productoEstrella?.ingresosGenerados.toFixed(2)}</p>
                            </motion.div>

                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-slate-100 transform group-hover:scale-110 transition-transform"><TrendingUp size={80}/></div>
                                <h3 className="text-slate-500 text-sm font-medium mb-1 relative z-10">Plato Más Vendido</h3>
                                <p className="text-xl font-bold text-slate-800 truncate relative z-10">
                                    {resumen.platoMasVendido?.nombre || '-'}
                                </p>
                                <p className="text-sm font-medium text-slate-600 mt-1 relative z-10">{resumen.platoMasVendido?.cantidadVendida} unidades vendidas</p>
                            </motion.div>

                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-slate-100 transform group-hover:scale-110 transition-transform"><BarChart3 size={80}/></div>
                                <h3 className="text-slate-500 text-sm font-medium mb-1 relative z-10">Bebida Más Vendida</h3>
                                <p className="text-xl font-bold text-slate-800 truncate relative z-10">
                                    {resumen.bebidaMasVendida?.nombre || '-'}
                                </p>
                                <p className="text-sm font-medium text-slate-600 mt-1 relative z-10">{resumen.bebidaMasVendida?.cantidadVendida} unidades vendidas</p>
                            </motion.div>
                        </div>

                        {/* Gráficos */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Ingresos por Categoría</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartDataCategorias}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {chartDataCategorias.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Top 5 Productos que más recaudan</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartDataTopProductos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" tickFormatter={(val) => `S/${val}`} stroke="#64748B" />
                                            <YAxis dataKey="name" type="category" width={100} stroke="#64748B" fontSize={12} />
                                            <RechartsTooltip cursor={{fill: '#F1F5F9'}} formatter={(value) => `S/ ${Number(value).toFixed(2)}`} />
                                            <Bar dataKey="ingresos" fill="#C8102E" radius={[0, 4, 4, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Productos Detallada */}
                        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Desglose Detallado por Producto</h2>
                                    <p className="text-slate-500 text-sm">Lista completa de ventas en el periodo seleccionado</p>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar producto..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pocholo-red/20 focus:border-pocholo-red transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                                            <th className="p-4 font-bold cursor-pointer hover:text-pocholo-red transition-colors" onClick={() => toggleSort('nombre')}>
                                                <div className="flex items-center gap-1">Producto {sortField === 'nombre' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-4 font-bold cursor-pointer hover:text-pocholo-red transition-colors" onClick={() => toggleSort('tipo')}>
                                                <div className="flex items-center gap-1">Categoría {sortField === 'tipo' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-4 font-bold text-right cursor-pointer hover:text-pocholo-red transition-colors" onClick={() => toggleSort('cantidadVendida')}>
                                                <div className="flex items-center justify-end gap-1">Cant. Vendida {sortField === 'cantidadVendida' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                            <th className="p-4 font-bold text-right cursor-pointer hover:text-pocholo-red transition-colors" onClick={() => toggleSort('ingresosGenerados')}>
                                                <div className="flex items-center justify-end gap-1">Ingreso Total {sortField === 'ingresosGenerados' && (sortDirection === 'asc' ? '↑' : '↓')}</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {processedProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-500">
                                                    No se encontraron productos que coincidan con "{searchQuery}"
                                                </td>
                                            </tr>
                                        ) : (
                                            processedProducts.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800">{p.nombre}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                            p.tipo === 'pollo' ? 'bg-yellow-100 border-yellow-200 text-yellow-700' :
                                                            p.tipo === 'bebida' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                                            p.tipo === 'promocion' ? 'bg-purple-100 border-purple-200 text-purple-700' :
                                                            'bg-slate-100 border-slate-200 text-slate-700'
                                                        }`}>
                                                            {getTipoLabel(p.tipo)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right text-slate-600 font-medium">
                                                        {p.cantidadVendida}
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-pocholo-red">
                                                        S/ {p.ingresosGenerados.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Calendario */}
            <AnimatePresence>
                {mostrarCalendario && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
                        >
                            <button
                                onClick={() => setMostrarCalendario(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-xl font-bold text-slate-800 mb-6">Seleccionar Fecha</h3>

                            {/* Tipo de filtro */}
                            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => setTipoRango('dia')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        tipoRango === 'dia' ? 'bg-white text-pocholo-red shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Día Específico
                                </button>
                                <button
                                    onClick={() => {
                                        setTipoRango('rango');
                                        setSeleccionandoRango('inicio');
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        tipoRango === 'rango' ? 'bg-white text-pocholo-red shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Rango
                                </button>
                            </div>

                            {/* Navegación del mes */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                                    <ChevronLeft size={20} />
                                </button>
                                <h4 className="text-slate-800 font-bold capitalize">
                                    {format(mesCalendario, 'MMMM yyyy', { locale: es })}
                                </h4>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                                    <div key={day} className="text-xs font-bold text-slate-400 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Cuadrícula del calendario */}
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendar()}
                            </div>

                            {tipoRango === 'rango' && (
                                <div className="mt-6 text-sm text-center">
                                    <p className="text-slate-500 font-medium">
                                        {seleccionandoRango === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha de fin'}
                                    </p>
                                    {(fechaInicio || fechaFin) && (
                                        <p className="text-pocholo-red font-bold mt-2 text-lg">
                                            {fechaInicio && format(fechaInicio, 'dd/MM/yyyy')} 
                                            {' - '}
                                            {fechaFin ? format(fechaFin, 'dd/MM/yyyy') : '...'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
