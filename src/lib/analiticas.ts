import { obtenerVentasPorRango } from './reportes';
import type { Venta, ItemVenta } from './database.types';

export interface AnaliticaProducto {
    id: string;
    nombre: string;
    tipo: 'pollo' | 'bebida' | 'complemento' | 'promocion' | 'desconocido';
    cantidadVendida: number;
    ingresosGenerados: number;
}

export interface ResumenAnaliticas {
    totalIngresos: number;
    productoEstrella: AnaliticaProducto | null;
    bebidaMasVendida: AnaliticaProducto | null;
    platoMasVendido: AnaliticaProducto | null;
    productos: AnaliticaProducto[];
}

export const procesarAnaliticas = (ventas: Venta[]): ResumenAnaliticas => {
    const mapa = new Map<string, AnaliticaProducto>();
    let totalIngresos = 0;

    ventas.forEach(venta => {
        venta.items.forEach(item => {
            const key = item.nombre;
            
            if (!mapa.has(key)) {
                mapa.set(key, {
                    id: item.producto_id || key,
                    nombre: item.nombre,
                    tipo: item.tipo || 'desconocido',
                    cantidadVendida: 0,
                    ingresosGenerados: 0
                });
            }

            const stats = mapa.get(key)!;
            stats.cantidadVendida += item.cantidad;
            const precio = item.precio || 0;
            const ingresosDelItem = item.cantidad * precio;
            
            stats.ingresosGenerados += ingresosDelItem;
            // No sumamos a totalIngresos aquí para evitar descuadres si hay descuentos en la venta global, 
            // pero como es reporte de *productos*, mostraremos la suma de los productos.
        });
        
        // Es más exacto sumar el total real de la venta, ya que a veces hay diferencias por redondeos o delivery
        totalIngresos += venta.total;
    });

    // Convertimos el mapa a array y lo ordenamos por ingresos generados de mayor a menor
    const productos = Array.from(mapa.values()).sort((a, b) => b.ingresosGenerados - a.ingresosGenerados);

    // Encontrar destacados
    const productoEstrella = productos.length > 0 ? productos[0] : null;
    
    const bebidas = productos.filter(p => p.tipo === 'bebida');
    const bebidaMasVendida = bebidas.length > 0 ? bebidas.sort((a, b) => b.cantidadVendida - a.cantidadVendida)[0] : null;
    
    const platos = productos.filter(p => p.tipo === 'pollo' || p.tipo === 'promocion');
    const platoMasVendido = platos.length > 0 ? platos.sort((a, b) => b.cantidadVendida - a.cantidadVendida)[0] : null;

    return {
        totalIngresos,
        productoEstrella,
        bebidaMasVendida,
        platoMasVendido,
        productos
    };
};
