'use client';

import { useState, useEffect } from 'react';
import { 
    Calendar, TrendingUp, Filter, BarChart3, PieChart as PieChartIcon,
    DollarSign, Package, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { 
    obtenerVentasPorRango, 
} from '@/lib/reportes';
import { 
    procesarAnaliticas, 
    type ResumenAnaliticas, 
    type AnaliticaProducto 
} from '@/lib/analiticas';
import type { Venta } from '@/lib/database.types';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

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
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };
    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), day);
        if (tipoRango === 'dia') {
            setFechaSeleccionada(clickedDate);
            setMostrarCalendario(false);
        } else {
            if (seleccionandoRango === 'inicio') {
                setFechaInicio(clickedDate);
                if (clickedDate > fechaFin) {
                    setFechaFin(clickedDate);
                }
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

    // Renderizado del calendario (simplificado del original)
    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(mesCalendario);
        const firstDay = getFirstDayOfMonth(mesCalendario);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), i);
            let isSelected = false;
            let isStart = false;
            let isEnd = false;
            let isInRange = false;

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
                    className={`
                        h-10 w-full rounded-full flex items-center justify-center text-sm transition-all
                        ${isSelected ? 'bg-pocholo-yellow text-black font-bold' : ''}
                        ${isStart || isEnd ? 'bg-pocholo-yellow text-black font-bold' : ''}
                        ${isInRange && !isStart && !isEnd ? 'bg-pocholo-yellow/20 text-white' : ''}
                        ${!isSelected && !isStart && !isEnd && !isInRange ? 'text-white hover:bg-white/10' : ''}
                    `}
                >
                    {i}
                </button>
            );
        }

        return days;
    };

    // Sorted products for table
    const sortedProducts = resumen ? [...resumen.productos].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    }) : [];

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
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

    return (
        <div className="min-h-screen bg-pocholo-dark p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <PieChartIcon className="text-pocholo-yellow" size={32} />
                            Analíticas de Productos
                        </h1>
                        <p className="text-white/60 mt-1">
                            Análisis detallado de ingresos por producto vendido
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setMostrarCalendario(true)}
                            className="glass flex items-center justify-center gap-2 px-6 py-3 rounded-xl hover:bg-white/20 transition-colors w-full sm:w-auto"
                        >
                            <Calendar size={20} className="text-pocholo-yellow" />
                            <span className="text-white whitespace-nowrap font-medium">
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
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
                        >
                            {rango.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-pocholo-yellow"></div>
                    </div>
                ) : !resumen || resumen.productos.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <PieChartIcon className="mx-auto text-white/20 mb-4" size={48} />
                        <h3 className="text-xl font-medium text-white mb-2">Sin datos disponibles</h3>
                        <p className="text-white/50">No hay ventas registradas en el rango de fechas seleccionado.</p>
                    </div>
                ) : (
                    <>
                        {/* Tarjetas de Resumen */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform"><DollarSign size={64}/></div>
                                <h3 className="text-white/60 text-sm font-medium mb-1">Total Generado en Productos</h3>
                                <p className="text-3xl font-bold text-white">S/ {resumen.totalIngresos.toFixed(2)}</p>
                            </motion.div>
                            
                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform"><Package size={64}/></div>
                                <h3 className="text-white/60 text-sm font-medium mb-1">Producto Estrella</h3>
                                <p className="text-2xl font-bold text-pocholo-yellow truncate">
                                    {resumen.productoEstrella?.nombre || '-'}
                                </p>
                                <p className="text-sm text-white/60 mt-1">S/ {resumen.productoEstrella?.ingresosGenerados.toFixed(2)}</p>
                            </motion.div>

                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform"><TrendingUp size={64}/></div>
                                <h3 className="text-white/60 text-sm font-medium mb-1">Plato Más Vendido</h3>
                                <p className="text-xl font-bold text-white truncate">
                                    {resumen.platoMasVendido?.nombre || '-'}
                                </p>
                                <p className="text-sm text-white/60 mt-1">{resumen.platoMasVendido?.cantidadVendida} unidades</p>
                            </motion.div>

                            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform"><BarChart3 size={64}/></div>
                                <h3 className="text-white/60 text-sm font-medium mb-1">Bebida Más Vendida</h3>
                                <p className="text-xl font-bold text-white truncate">
                                    {resumen.bebidaMasVendida?.nombre || '-'}
                                </p>
                                <p className="text-sm text-white/60 mt-1">{resumen.bebidaMasVendida?.cantidadVendida} unidades</p>
                            </motion.div>
                        </div>

                        {/* Tabla de Productos Detallada */}
                        <div className="glass-panel rounded-2xl overflow-hidden mt-6">
                            <div className="p-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Desglose Detallado por Producto</h2>
                                    <p className="text-white/60 text-sm">Todas las ventas generadas en el periodo seleccionado</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-black/20 text-white/60 text-sm uppercase tracking-wider">
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('nombre')}>
                                                Producto {sortField === 'nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold cursor-pointer hover:text-white" onClick={() => toggleSort('tipo')}>
                                                Categoría {sortField === 'tipo' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => toggleSort('cantidadVendida')}>
                                                Cant. Vendida {sortField === 'cantidadVendida' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                            <th className="p-4 font-semibold text-right cursor-pointer hover:text-white" onClick={() => toggleSort('ingresosGenerados')}>
                                                Ingreso Total {sortField === 'ingresosGenerados' && (sortDirection === 'asc' ? '↑' : '↓')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedProducts.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{p.nombre}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                        p.tipo === 'pollo' ? 'bg-pocholo-yellow/10 border-pocholo-yellow/20 text-pocholo-yellow' :
                                                        p.tipo === 'bebida' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                        p.tipo === 'promocion' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                                    }`}>
                                                        {getTipoLabel(p.tipo)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right text-white/90 font-medium">
                                                    {p.cantidadVendida}
                                                </td>
                                                <td className="p-4 text-right font-bold text-pocholo-yellow">
                                                    S/ {p.ingresosGenerados.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
                        >
                            <button
                                onClick={() => setMostrarCalendario(false)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-xl font-bold text-white mb-6">Seleccionar Fecha</h3>

                            {/* Tipo de filtro */}
                            <div className="flex bg-black/40 rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => setTipoRango('dia')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        tipoRango === 'dia' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                                    }`}
                                >
                                    Día Específico
                                </button>
                                <button
                                    onClick={() => {
                                        setTipoRango('rango');
                                        setSeleccionandoRango('inicio');
                                    }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        tipoRango === 'rango' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                                    }`}
                                >
                                    Rango
                                </button>
                            </div>

                            {/* Navegación del mes */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-white">
                                    <ChevronLeft size={20} />
                                </button>
                                <h4 className="text-white font-medium capitalize">
                                    {format(mesCalendario, 'MMMM yyyy', { locale: es })}
                                </h4>
                                <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-white">
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            {/* Días de la semana */}
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                                    <div key={day} className="text-xs font-medium text-white/50 py-2">
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
                                    <p className="text-white/70">
                                        {seleccionandoRango === 'inicio' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha de fin'}
                                    </p>
                                    {(fechaInicio || fechaFin) && (
                                        <p className="text-pocholo-yellow font-medium mt-2">
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
