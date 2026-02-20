const { useState, useEffect } = React;

    // Helper functions in global scope
    function parseGermanDate(dateStr) {
      const [day, month, year] = dateStr.split('.');
      return new Date(year, month - 1, day);
    }

    function getDeliveryStatus(deliveryDate) {
      if (!deliveryDate) return { status: 'Offen', badge: 'neutral' };
      
      const today = new Date('2026-01-03'); // Current date from system
      const delivery = parseGermanDate(deliveryDate);
      
      if (delivery < today) return { status: 'Überfällig', badge: 'danger' };
      
      // This week (Jan 3-9, 2026)
      const weekEnd = new Date('2026-01-09');
      if (delivery <= weekEnd) return { status: 'Diese Woche', badge: 'success' };
      
      return { status: 'Geplant', badge: 'success' };
    }

    function formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
      return num.toString();
    }

    function formatNumberFull(num) {
      return num.toLocaleString('de-DE');
    }

    function generateLPN(orderId, vpeNumber) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const orderNum = orderId.replace('AG ', '');
      return `LPN-${orderNum}-${today}-${String(vpeNumber).padStart(3, '0')}`;
    }

    // Warehouse locations with delivery times (global constant)
    const WAREHOUSES = {
      'HQ': { name: 'Hauptlager', deliveryDays: 0 },
      'LAGER1': { name: 'Außenlager 1', deliveryDays: 1 },
      'LAGER2': { name: 'Außenlager 2', deliveryDays: 2 },
      'LAGER3': { name: 'Außenlager 3', deliveryDays: 3 }
    };

    // Main App Component