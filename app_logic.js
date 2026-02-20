function App() {
      const [currentView, setCurrentView] = useState('warehouse'); // warehouse, shipping, or purchasing
      const [currentScreen, setCurrentScreen] = useState('incoming-orders'); // incoming-orders, received-orders, distribution, picking
      
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedDelivery, setSelectedDelivery] = useState(null);
      const [selectedProduct, setSelectedProduct] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const [selectedOrder, setSelectedOrder] = useState(null); // For warning modal
      const [modalType, setModalType] = useState(''); // split, labels, warning, quantity-deviation, vpe-split
      const [quantity, setQuantity] = useState(100);
      const [splitQtyPrimary, setSplitQtyPrimary] = useState(20);
      const [vpeSize, setVpeSize] = useState(1); // How many pieces per VPE
      const [vpeUnits, setVpeUnits] = useState([]); // Array of VPE units to create
      const [pdfOpened, setPdfOpened] = useState(false); // Track if PDF was opened
      const [deliveryNote, setDeliveryNote] = useState(null); // Uploaded delivery note image
      const [receivedOrders, setReceivedOrders] = useState([]); // List of completed orders
      
      // Track which positions of multi-position orders have been booked
      const [orderBookingStatus, setOrderBookingStatus] = useState({}); 
      // Format: { 'AG 236513': { bookedPositions: [1, 3], deliveryNote: imageData, totalPositions: 5 } }
      
      // Track LPN counter per order
      const [orderLpnCounters, setOrderLpnCounters] = useState({});
      // Format: { 'AG 236513': 3 } means next LPN is 004
      
      const [incomingDeliveries, setIncomingDeliveries] = useState([ // ← NEW: State for incoming orders
        { 
          id: 1,
          orderId: 'AG 236513', 
          supplier: 'systemwerk GmbH & Co. KG', 
          contact: 'ManuelN',
          items: 6, 
          deliveryDate: '03.01.2026',
          priority: 1
        },
        { 
          id: 2,
          orderId: 'AG 239238', 
          supplier: 'Krückemeyer GmbH', 
          contact: 'Felix',
          items: 1, 
          deliveryDate: '03.01.2026',
          priority: 1
        },
        { 
          id: 3,
          orderId: 'AG 239239', 
          supplier: 'Krückemeyer GmbH', 
          contact: 'Felix',
          items: 3, 
          deliveryDate: '04.01.2026',
          priority: 1
        },
        { 
          id: 5,
          orderId: 'AG 239472', 
          supplier: 'Mouser Electronics, Inc.', 
          contact: 'Safak',
          items: 1, 
          deliveryDate: '06.01.2026',
          priority: 1
        },
        { 
          id: 6,
          orderId: 'AG 239494', 
          supplier: 'TRIOTRONIK Computer und Netzwerktechnik GmbH', 
          contact: 'Safak',
          items: 1, 
          deliveryDate: '05.01.2026',
          priority: 1
        },
        { 
          id: 7,
          orderId: 'AG 239592', 
          supplier: 'Krückemeyer GmbH', 
          contact: 'Felix',
          items: 1, 
          deliveryDate: '02.01.2026',
          priority: 1
        },
        { 
          id: 8,
          orderId: 'AG 206565', 
          supplier: 'Linxens Germany GmbH', 
          contact: 'Felix',
          items: 2, 
          deliveryDate: '15.10.2025',
          priority: 2
        },
        { 
          id: 4,
          orderId: 'AG 239293', 
          supplier: 'SPRINTIS Schenk GmbH & Co. KG', 
          contact: 'Safak',
          items: 1, 
          deliveryDate: '28.12.2025',
          priority: 2
        },
        { 
          id: 9,
          orderId: 'AG 237892', 
          supplier: 'Tech Supply GmbH', 
          contact: 'ManuelN',
          items: 2, 
          deliveryDate: null,
          priority: 3
        },
        { 
          id: 10,
          orderId: 'AG 238104', 
          supplier: 'Digital Solutions AG', 
          contact: 'Safak',
          items: 1, 
          deliveryDate: null,
          priority: 3
        },
        // External Warehouse Orders
        { 
          id: 11,
          orderId: 'AG 240001', 
          supplier: 'Butz & Bürker GmbH & Co. KG', 
          contact: 'Felix',
          items: 2, 
          deliveryDate: '06.01.2026',
          priority: 1,
          warehouse: 'LAGER1',
          warehouseName: 'Außenlager 1'
        },
        { 
          id: 12,
          orderId: 'AG 240002', 
          supplier: 'Swastik Needles', 
          contact: 'ManuelN',
          items: 1, 
          deliveryDate: '07.01.2026',
          priority: 1,
          warehouse: 'LAGER2',
          warehouseName: 'Außenlager 2'
        },
        { 
          id: 13,
          orderId: 'AG 240003', 
          supplier: 'Bischoff GmbH', 
          contact: 'Felix',
          items: 1, 
          deliveryDate: '08.01.2026',
          priority: 1,
          warehouse: 'LAGER2',
          warehouseName: 'Außenlager 2'
        }
      ]);
      const [relocationOrders, setRelocationOrders] = useState([
        { 
          productName: 'Passiv-Transponder v2 mit Schaum',
          productId: '1722', // Match with inventory ID
          lpn: 'LPN-239592-20260102-001',
          quantity: 4,
          vpeNumber: 1,
          orderId: 'AG 239592',
          supplier: 'Krückemeyer GmbH'
        },
        { 
          productName: 'Passiv-Transponder v2 mit Schaum',
          productId: '1722', // Match with inventory ID
          lpn: 'LPN-239592-20260102-002',
          quantity: 4,
          vpeNumber: 2,
          orderId: 'AG 239592',
          supplier: 'Krückemeyer GmbH'
        },
        { 
          productName: 'Aktiv-Transponder TP4000',
          productId: '1723', // Match with inventory ID
          lpn: 'LPN-239593-20260102-001',
          quantity: 10,
          vpeNumber: 1,
          orderId: 'AG 239593',
          supplier: 'ChampionChip'
        }
      ]); // Orders waiting for storage location assignment
      
      const [assignedVPEs, setAssignedVPEs] = useState([]); // Track which VPE LPNs have been assigned to a location
      
      const [inventoryItems, setInventoryItems] = useState([
        {
          type: 'BuyingPart',
          id: '197',
          productName: 'Loop-Kabel auf Rolle, 30 m',
          variant: '0',
          supplier: 'race result AG',
          storage: 'ER1-A4',
          onStock: 53,
          lpn: 'LPN-197-LEGACY-001',
          isPrimary: true
        },
        {
          type: 'BuyingPart',
          id: '296',
          productName: 'RRS 4,8 m Antenne - Kabel Nr. 6 - 4,18 m',
          variant: '0',
          supplier: '',
          storage: 'AL-78',
          onStock: 29,
          lpn: 'LPN-296-LEGACY-001',
          isPrimary: true
        },
        {
          type: 'StockAssembly',
          id: '2871',
          productName: 'Tyvek 75g, SRA3, gestanzt',
          variant: '27 PC2B1',
          supplier: '',
          storage: 'DL-24',
          onStock: 1200,
          lpn: 'LPN-2871-LEGACY-001',
          isPrimary: true
        },
        {
          type: 'StockAssembly',
          id: '2871',
          productName: 'Tyvek 75g, SRA3, gestanzt',
          variant: '27 PC2B1',
          supplier: '',
          storage: 'DL-12',
          onStock: 1200,
          lpn: 'LPN-2871-LEGACY-002',
          isPrimary: false
        },
        {
          type: 'BuyingPart',
          id: '1722',
          productName: 'Passiv-Transponder v2 mit Schaum',
          variant: '0',
          supplier: 'Krückemeyer GmbH',
          storage: 'A-01-03',
          onStock: 5,
          lpn: 'LPN-1722-LEGACY-001',
          isPrimary: true,
          // Master Data for Replenishment Testing
          dimensionsOne: {
            width: 15,
            height: 2,
            depth: 30,
            weight: 0.005
          },
          dimensionsVPE: {
            width: 400,
            height: 100,
            depth: 350,
            weight: 4.5,
            qty: 1000
          },
          minStockGeneral: 10000,
          minStockMainLocation: 100,  // ← Main location needs min 100, but only has 5!
          mainLocation: 'A-01-03'
        },
        {
          type: 'BuyingPart',
          id: '1722',
          productName: 'Passiv-Transponder v2 mit Schaum',
          variant: '0',
          supplier: 'Krückemeyer GmbH',
          storage: 'PAT-5',  // ← Reserve location
          onStock: 50000,
          lpn: 'LPN-1722-RESERVE-001',
          isPrimary: false,
          // Master Data
          dimensionsOne: {
            width: 15,
            height: 2,
            depth: 30,
            weight: 0.005
          },
          dimensionsVPE: {
            width: 400,
            height: 100,
            depth: 350,
            weight: 4.5,
            qty: 1000
          },
          minStockGeneral: 10000,
          minStockMainLocation: 100,
          mainLocation: 'A-01-03'
        },
        {
          type: 'BuyingPart',
          id: '1723',
          productName: 'Aktiv-Transponder TP4000',
          variant: '0',
          supplier: 'ChampionChip',
          storage: 'B-05-12',
          onStock: 100,
          lpn: 'LPN-1723-LEGACY-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        // External Warehouse Items
        {
          type: 'StockAssembly',
          id: '2871',
          productName: 'Tyvek 75g, SRA3, gestanzt',
          variant: '28 PC2R',
          supplier: 'Butz & Bürker GmbH & Co. KG',
          storage: 'LAGER1-A1',
          onStock: 5000,
          lpn: 'LPN-2871-LAGER1-001',
          isPrimary: true,
          warehouse: 'LAGER1'
        },
        {
          type: 'Good',
          id: '1',
          productName: 'Sicherheitsnadeln, 1.000 Stück',
          variant: '0',
          supplier: 'Swastik Needles',
          storage: 'LAGER2-B3',
          onStock: 500000,
          lpn: 'LPN-1-LAGER2-001',
          isPrimary: true,
          warehouse: 'LAGER2'
        },
        // Items for Picking Demo
        {
          type: 'BuyingPart',
          id: '512',
          productName: 'Ubidium Carrying bag',
          variant: '0',
          supplier: '',
          storage: 'DL-22',
          onStock: 1,
          lpn: 'LPN-512-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '113',
          productName: 'Sicherheitsnadeln',
          variant: '0',
          supplier: '',
          storage: 'DL-23',
          onStock: 0,  // ← LEER!
          lpn: 'LPN-113-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '113',
          productName: 'Sicherheitsnadeln',
          variant: '0',
          supplier: '',
          storage: 'PAT-2',
          onStock: 127,
          lpn: 'LPN-113-PAT-001',
          isPrimary: false,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '147',
          productName: '3000 Schaum-Spacer',
          variant: '0',
          supplier: 'Krückemeyer GmbH',
          storage: 'DL-32',
          onStock: 12,
          lpn: 'LPN-147-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '267',
          productName: '1000 RACE RESULT A-Z Transponder',
          variant: '0',
          supplier: '',
          storage: 'DL-27',
          onStock: 1,
          lpn: 'LPN-267-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '267',
          productName: '1000 RACE RESULT A-Z Transponder',
          variant: '0',
          supplier: '',
          storage: 'DL-27',
          onStock: 15,
          lpn: 'LPN-267-PICK-002',
          isPrimary: false,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '321',
          productName: '12V Battery Booster',
          variant: '0',
          supplier: '',
          storage: 'DL-11',
          onStock: 4,
          lpn: 'LPN-321-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        },
        {
          type: 'BuyingPart',
          id: '505',
          productName: 'Ubidium Bundle 4,6 m',
          variant: '0',
          supplier: '',
          storage: 'DL-24',
          onStock: 2,
          lpn: 'LPN-505-PICK-001',
          isPrimary: true,
          warehouse: 'HQ'
        }
      ].map(item => ({ ...item, warehouse: item.warehouse || 'HQ' }))); // Inventory with storage locations
      
      // Initialize picking orders from shipping orders with product details
      const [pickingOrders, setPickingOrders] = useState([
        {
          orderId: 'AG 238615',
          customerName: 'WASE Timing', dueDate: '2026-02-22',
          status: 'open', // open, picking, picked, packed
          items: [
            { productId: '512', productName: 'Ubidium Carrying bag', qty: 1, storage: 'DL-22', picked: false }
          ]
        },
        {
          orderId: 'AG 239561',
          customerName: 'ASV Duisburg', dueDate: '2026-02-19',
          status: 'open',
          items: [
            { productId: '113', productName: 'Sicherheitsnadeln', qty: 27, storage: 'DL-23', picked: false }
          ]
        },
        {
          orderId: 'AG 239578',
          customerName: 'Springer Sport', dueDate: '2026-02-19',
          status: 'open',
          items: [
            { productId: '147', productName: '3000 Schaum-Spacer', qty: 12, storage: 'DL-32', picked: false }
          ]
        },
        {
          orderId: 'AG 239615',
          customerName: 'SleepFaster Inc', dueDate: '2026-02-20',
          status: 'open',
          items: [
            { productId: '267', productName: '1000 RACE RESULT A-Z Transponder', qty: 1, storage: 'DL-27', picked: false }
          ]
        },
        {
          orderId: 'AG 238911',
          customerName: 'NovaRace', dueDate: '2026-02-22',
          status: 'open',
          items: [
            { productId: '321', productName: '12V Battery Booster', qty: 4, storage: 'DL-11', picked: false },
            { productId: '267', productName: '1000 RACE RESULT A-Z Transponder', qty: 15, storage: 'DL-27', picked: false },
            { productId: '505', productName: 'Ubidium Bundle 4,6 m', qty: 2, storage: 'DL-24', picked: false }
          ]
        }
      ]);
      
      // Purchasing Tasks State
      const [purchasingTasks, setPurchasingTasks] = useState([]);
      
      // Quality Split State
      const [showQualitySplit, setShowQualitySplit] = useState(false);
      const [qualityOkQty, setQualityOkQty] = useState(0);
      const [qualityDefectQty, setQualityDefectQty] = useState(0);
      const [qualityReason, setQualityReason] = useState('');
      const [qualityPhoto, setQualityPhoto] = useState(null);
      
      // Overdelivery decision state
      const [overdeliveryDecision, setOverdeliveryDecision] = useState(null); // 'all' or 'separate'
      
      // REAL SHIPPING DATA from CSV
      const shippingOrderDetails = {
        '239615': [
          { id: 267, name: '1000 RACE RESULT A-Z Transponder', qty: 1 }
        ],
        '239578': [
          { id: 147, name: '3000 Schaum-Spacer', qty: 12 }
        ],
        '239561': [
          { id: 113, name: '4er RACE RESULT Sicherheitsnadeln, 800 Stück', qty: 27 }
        ],
        '238911': [
          { id: 505, name: 'Ubidium Bundle 4.6 m', qty: 2 },
          { id: 321, name: '12V Battery Booster', qty: 4 },
          { id: 267, name: '1000 RACE RESULT A-Z Transponder', qty: 15 }
        ],
        '238615': [
          { id: 512, name: 'Ubidium Carrying bag', qty: 1 }
        ]
      };

      const getShippingLocation = (productId) => {
        const dlCode = `DL-${String(Math.abs(productId) % 25 + 10).padStart(2, '0')}`;
        const patCode = `PAT-${Math.abs(productId) % 8 + 1}`;
        const routingIndex = 100 + (Math.abs(productId) % 25);
        
        return {
          code: dlCode,
          zone: 'Drucklager',
          routingIndex: routingIndex,
          reserve: {
            code: patCode,
            zone: 'Paternoster',
            routingIndex: 500 + (Math.abs(productId) % 8)
          }
        };
      };

      const [orders, setOrders] = useState([
        { 
          id: 'AG 238615', 
          customer: 'WASE Timing', dueDate: '2026-02-22',
          custNo: '28644',
          product: '1x Ubidium Carrying bag [512]', 
          location: getShippingLocation(512),
          status: 'ready', 
          warning: false 
        },
        { 
          id: 'AG 238911', 
          customer: 'NovaRace', dueDate: '2026-02-22',
          custNo: '90709',
          product: '2x Ubidium Bundle + 2 weitere', 
          location: getShippingLocation(505),
          status: 'ready', 
          warning: false
        },
        { 
          id: 'AG 239561', 
          customer: 'ASV Duisburg', dueDate: '2026-02-19',
          custNo: '58446',
          product: '27x Sicherheitsnadeln [113]', 
          location: getShippingLocation(113),
          status: 'ready', 
          warning: true,
          alternativeLocation: getShippingLocation(113).reserve
        },
        { 
          id: 'AG 239578', 
          customer: 'Springer Sport', dueDate: '2026-02-19',
          custNo: '34077',
          product: '12x Schaum-Spacer [147]', 
          location: getShippingLocation(147),
          status: 'ready', 
          warning: false
        },
        { 
          id: 'AG 239615', 
          customer: 'SleepFaster Inc', dueDate: '2026-02-20',
          custNo: '78949',
          product: '1x RACE RESULT Transponder [267]', 
          location: getShippingLocation(267),
          status: 'ready', 
          warning: false
        }
      ]);
      const [tasks, setTasks] = useState([
        { 
          id: 1, 
          title: 'DRINGEND: Nachschub DL-23', 
          subtitle: 'Hole aus Paternoster Ebene 3 (PAT-3)', 
          urgent: true,
          details: {
            product: '4er RACE RESULT Sicherheitsnadeln [113]',
            currentStock: 15,
            binMin: 20,
            targetQty: 30,
            vpe: 800,
            vpeUnit: 'Box',
            fromLocation: 'PAT-3 (Route #503)',
            toLocation: 'DL-23 (Route #123)'
          }
        }
      ]);
      
      const [returnTasks, setReturnTasks] = useState([]); // Tasks for warehouse returns
      const [selectedOverhangVPEs, setSelectedOverhangVPEs] = useState([]); // VPE indices marked as overhang
      const [vpeQuantities, setVpeQuantities] = useState([0]); // Dynamic VPE quantity inputs
      const [messages, setMessages] = useState([
        // Demo: Predictive replenishment warning
        {
          id: Date.now() - 1000,
          type: 'warning',
          title: 'Bestandsprognose - Nachschub erforderlich',
          message: 'Aktiv-Transponder TP4000 wird voraussichtlich in 10 Tagen leer laufen. Bitte Nachschub aus Lager 2 beschaffen.',
          productId: '1723',
          productName: 'Aktiv-Transponder TP4000',
          warehouse: 'LAGER2',
          daysUntilEmpty: 10,
          read: false,
          created: new Date().toLocaleString('de-DE')
        }
      ]); // Messages for warehouse staff
      const [selectedInventoryItem, setSelectedInventoryItem] = useState(null); // Selected item for detail view
      const [showInventoryEdit, setShowInventoryEdit] = useState(false); // Show edit modal for master data
      const [replenishmentTasks, setReplenishmentTasks] = useState([]); // Replenishment tasks for warehouse
      const [selectedWarehouse, setSelectedWarehouse] = useState('HQ'); // Selected warehouse for booking
      const [selectedLPNs, setSelectedLPNs] = useState([]); // Selected LPNs in distribution for bulk actions
      
      // AUDIT LOG - Track all inventory movements and actions
      const [auditLog, setAuditLog] = useState([]);
      const [auditLogFilter, setAuditLogFilter] = useState({
        location: '',
        articleId: '',
        action: 'ALL',
        lpn: ''
      });
      
      // Helper function to add audit log entry
      const addAuditLogEntry = (entry) => {
        const logEntry = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          user: 'Felix', // In production: get from auth system
          ...entry
        };
        setAuditLog(prev => [logEntry, ...prev]);
      };
      
      // Screen-specific filters (must be at top level, not inside conditionals!)
      const [incomingWarehouseFilter, setIncomingWarehouseFilter] = useState('ALL');
      const [distributionSearch, setDistributionSearch] = useState('');
      const [relocationSearch, setRelocationSearch] = useState('');
      const [transferSearch, setTransferSearch] = useState('');

      // State für 3-Wege-Zuweisung Modal (Distribution)
      const [assignLocationModal, setAssignLocationModal] = useState(null);
      // assignLocationModal = { item, location } oder null

      // Sortier-Modus für Picking: 'date' = nach Liefertermin, 'storage' = nach Lagerplatz
      const [pickingSortMode, setPickingSortMode] = useState('date');
      
      // Debug: Log when messages or replenishment tasks change
      React.useEffect(() => {
        console.log('🔔 MESSAGES STATE CHANGED:', messages.length, 'messages');
        if (messages.length > 0) {
          console.log('   Latest message:', messages[0]);
        }
      }, [messages]);
      
      React.useEffect(() => {
        console.log('🔔 REPLENISHMENT TASKS STATE CHANGED:', replenishmentTasks.length, 'tasks');
        if (replenishmentTasks.length > 0) {
          console.log('   Latest task:', replenishmentTasks[0]);
        }
      }, [replenishmentTasks]);

      // REAL DATA from CSV - Orders and Order Details combined
      // Sort deliveries: Diese Woche (prio 1) -> Überfällig (prio 2) -> Ohne Datum (prio 3)
      const deliveries = [...incomingDeliveries].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        
        // Within same priority, sort by date
        const dateA = a.deliveryDate ? parseGermanDate(a.deliveryDate) : new Date('2099-12-31');
        const dateB = b.deliveryDate ? parseGermanDate(b.deliveryDate) : new Date('2099-12-31');
        return dateA - dateB;
      });

      // Product catalog with warehouse locations
      // Helper functions for multi-position order tracking
      const getOrderStatus = (orderId) => {
        const status = orderBookingStatus[orderId];
        if (!status) return 'open'; // No positions booked yet
        
        const totalPositions = status.totalPositions || 0;
        const bookedCount = status.bookedPositions?.length || 0;
        
        if (bookedCount === 0) return 'open';
        
        // Check if ANY position has partial quantity
        const hasPartialQuantity = receivedOrders.some(order => 
          order.orderId === orderId && order.isPartialQuantity
        );
        
        // Check if there are any OPEN tasks for this order
        const hasOpenTasks = purchasingTasks.some(task => 
          task.orderId === orderId && 
          task.status !== 'RESOLVED' && 
          task.status !== 'WRITTEN_OFF' &&
          task.status !== 'B_WARE'
        );
        
        // If we have partial quantities OR open tasks, it's always PARTIAL
        if (hasPartialQuantity || hasOpenTasks) return 'partial';
        
        if (bookedCount === totalPositions) return 'complete';
        return 'partial';
      };
      
      const getOrderProgress = (orderId) => {
        const status = orderBookingStatus[orderId];
        if (!status) return null;
        
        const bookedCount = status.bookedPositions?.length || 0;
        const totalPositions = status.totalPositions || 0;
        
        return `${bookedCount}/${totalPositions}`;
      };
      
      const isPositionBooked = (orderId, positionNumber) => {
        const status = orderBookingStatus[orderId];
        return status?.bookedPositions?.includes(positionNumber) || false;
      };
      
      const hasDeliveryNote = (orderId) => {
        const status = orderBookingStatus[orderId];
        return !!status?.deliveryNote;
      };
      
      const getDeliveryNote = (orderId) => {
        const status = orderBookingStatus[orderId];
        return status?.deliveryNote || null;
      };

      const productCatalog = {
        '-1': { emoji: '📱', vpe: 1, vpeUnit: 'Stück', zone: 'Drucklager', binMin: 1, binMax: 20 },
        '147': { emoji: '📦', vpe: 12, vpeUnit: 'Karton', zone: 'Drucklager', binMin: 5, binMax: 50 },
        '113': { emoji: '📌', vpe: 800, vpeUnit: 'Box', zone: 'Drucklager', binMin: 10, binMax: 100 },
        '267': { emoji: '🏷️', vpe: 1000, vpeUnit: 'Karton', zone: 'Drucklager', binMin: 50, binMax: 2000 },
        '321': { emoji: '🔋', vpe: 1, vpeUnit: 'Stück', zone: 'Drucklager', binMin: 2, binMax: 20 },
        '505': { emoji: '📦', vpe: 1, vpeUnit: 'Bundle', zone: 'Drucklager', binMin: 1, binMax: 10 },
        '512': { emoji: '👜', vpe: 1, vpeUnit: 'Stück', zone: 'Drucklager', binMin: 1, binMax: 15 },
        '1722': { emoji: '🏷️', vpe: 10000, vpeUnit: 'Karton', zone: 'Weingarten (Extern)', binMin: 500, binMax: 50000 },
        '1493': { emoji: '📋', vpe: 100, vpeUnit: 'Palette', zone: 'Paternoster', binMin: 50, binMax: 300 },
        '1856': { emoji: '🔖', vpe: 5000, vpeUnit: 'Karton', zone: 'Weingarten (Extern)', binMin: 200, binMax: 20000 },
        '3431': { emoji: '🧵', vpe: 1000, vpeUnit: 'Rolle', zone: 'Drucklager', binMin: 100, binMax: 2000 },
        '1372': { emoji: '📡', vpe: 50, vpeUnit: 'Karton', zone: 'Drucklager', binMin: 25, binMax: 150 },
        '1704': { emoji: '🔌', vpe: 50, vpeUnit: 'Beutel', zone: 'Drucklager', binMin: 20, binMax: 200 }
      };

      // Order details mapped to each order
      const orderProducts = {
        '236513': [
          { id: -1, name: 'Yealink SIP-T54W', supplierName: null, ordered: 23, pos: 1 },
          { id: -1, name: 'Yealink EXP50', supplierName: null, ordered: 2, pos: 2 },
          { id: -1, name: 'Yealink CP925', supplierName: null, ordered: 2, pos: 3 },
          { id: -1, name: 'Yealink WH64 Mono', supplierName: null, ordered: 2, pos: 4 },
          { id: -1, name: 'Grandstream HT812', supplierName: null, ordered: 1, pos: 5 }
        ],
        '239592': [
          { id: 147, name: '3000 Schaum-Spacer', supplierName: 'Krückemeyer GmbH 62928', ordered: 12, pos: 1 }
        ],
        '239472': [
          { id: 1372, name: 'RRS Diversity Antenna', supplierName: null, ordered: 250, pos: 1 }
        ],
        '239239': [
          { id: 1722, name: 'Passiv-Transponder v2 mit Schaum', supplierName: 'Krückemeyer GmbH 63688 / 72315', ordered: 630000, pos: 1 },
          { id: 1493, name: 'Schaumplatte für TriTag', supplierName: 'Krückemeyer GmbH 56524', ordered: 2550, pos: 2 },
          { id: 1856, name: 'Passiv-Transponder v2 ohne Schaum', supplierName: 'Krückemeyer GmbH 62653', ordered: 90000, pos: 3 }
        ],
        '239494': [
          { id: 1704, name: 'RRS internes Patchkabel 25cm', supplierName: null, ordered: 100, pos: 1 }
        ],
        '239238': [
          { id: 1722, name: 'Passiv-Transponder v2 mit Schaum', supplierName: 'Krückemeyer GmbH 63688 / 72315', ordered: 270000, pos: 1 }
        ],
        '206565': [
          { id: 1722, name: 'Passiv-Transponder v2 mit Schaum', supplierName: 'IRONMAN UCODE8 WET INLAY WITH FOAM beta test', ordered: 1000000, pos: 1 },
          { id: 1722, name: 'Passiv-Transponder v2 mit Schaum', supplierName: 'IRONMAN UCODE8 WET INLAY WITH FOAM beta test', ordered: 4000000, pos: 2 }
        ],
        '239293': [
          { id: 3431, name: 'Gummizugschnur 410 mm, schwarz', supplierName: 'SPRINTIS Schenk GmbH & Co. KG GZXX000101', ordered: 1000, pos: 1 }
        ],
        '237892': [
          { id: 1704, name: 'RRS internes Patchkabel 25cm', supplierName: null, ordered: 50, pos: 1 },
          { id: 1372, name: 'RRS Diversity Antenna', supplierName: null, ordered: 100, pos: 2 }
        ],
        '238104': [
          { id: 321, name: '12V Battery Booster', supplierName: null, ordered: 3, pos: 1 }
        ],
        '240001': [ // Außenlager 1 - Tyvek
          { id: 2871, name: 'Tyvek 75g, SRA3, gestanzt', supplierName: 'Butz & Bürker GmbH & Co. KG 27 PC2B1', ordered: 30000, pos: 1, variant: '27 PC2B1' },
          { id: 2871, name: 'Tyvek 75g, SRA3, gestanzt', supplierName: 'Butz & Bürker GmbH & Co. KG 28 PC2R', ordered: 30000, pos: 2, variant: '28 PC2R' }
        ],
        '240002': [ // Außenlager 2 - Sicherheitsnadeln
          { id: 1, name: 'Sicherheitsnadeln, 1.000 Stück', supplierName: 'Swastik Needles', ordered: 1000000, pos: 1 }
        ],
        '240003': [ // Außenlager 2 - Aktiv-Transponder
          { id: 1723, name: 'Aktiv-Transponder TP4000', supplierName: 'Bischoff GmbH', ordered: 1000, pos: 1 }
        ]
      };

      // Helper function to format large numbers
      const formatNumber = (num) => {
        if (num >= 1000000) {
          return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
          return (num / 1000).toFixed(0) + 'k';
        }
        return num.toString();
      };

      const formatNumberFull = (num) => {
        return num.toLocaleString('de-DE');
      };
      const getProductDetails = (productId, productName, supplierName, quantity, positionNumber = 1, variant = null, alreadyReceived = null, isBackorderProduct = false) => {
        const catalog = productCatalog[productId] || productCatalog['-1'];
        const dlCode = `DL-${String(Math.abs(productId) % 30 + 10).padStart(2, '0')}`;
        const patCode = `PAT-${Math.abs(productId) % 10 + 1}`;
        const weiCode = `WEI-A${Math.abs(productId) % 5 + 1}`;
        
        const isExternal = catalog.zone === 'Weingarten (Extern)';
        
        return {
          id: productId,
          name: productName,
          supplierName: supplierName,
          ordered: quantity,
          pos: positionNumber, // ← Position number in order
          variant: variant,  // ← NEU: Variante
          status: 'Offen',
          emoji: catalog.emoji,
          vpe: catalog.vpe,
          vpeUnit: catalog.vpeUnit,
          primaryLocation: {
            code: isExternal ? weiCode : dlCode,
            zone: catalog.zone,
            binMin: catalog.binMin,
            binMax: catalog.binMax,
            routingIndex: isExternal ? 900 + (Math.abs(productId) % 10) : 100 + (Math.abs(productId) % 30)
          },
          reserveLocation: {
            code: isExternal ? weiCode + '-R' : patCode,
            zone: isExternal ? catalog.zone : 'Paternoster',
            routingIndex: isExternal ? 950 + (Math.abs(productId) % 10) : 500 + (Math.abs(productId) % 10)
          },
          alreadyReceived: alreadyReceived, // ← For backorders
          isBackorderProduct: isBackorderProduct // ← Flag for backorders
        };
      };

      // Get products for current order (will be set dynamically)
      const getCurrentOrderId = () => {
        // Default to first Krückemeyer order
        return '239592';
      };

      // Load products - check if delivery has products array or use orderProducts
      const products = selectedDelivery && selectedDelivery.products
        ? selectedDelivery.products.map(p => {
            console.log('🟢 Loading product from delivery:', p);
            return getProductDetails(p.id, p.name, p.supplierName || selectedDelivery.supplier, p.ordered, p.pos || 1, p.variant, p.alreadyReceived, p.isBackorderProduct);
          })
        : (selectedDelivery && orderProducts[selectedDelivery.orderId]
            ? orderProducts[selectedDelivery.orderId].map(p => {
                console.log('🟠 Loading product from orderProducts:', p);
                return getProductDetails(p.id, p.name, p.supplierName, p.ordered);
              })
            : []
          );

      console.log('📦 Final products array:', products);

      const filteredDeliveries = deliveries.filter(d => {
        // Exclude COMPLETE orders (but keep PARTIAL and OPEN)
        const orderStatus = getOrderStatus(d.orderId);
        
        if (orderStatus === 'complete') {
          console.log(`Filtering out COMPLETE order: ${d.orderId}`);
          return false;
        }
        
        // Keep orders that are 'open' or 'partial'
        if (orderStatus === 'partial') {
          console.log(`Keeping PARTIAL order: ${d.orderId} (${getOrderProgress(d.orderId)})`);
        }
        
        // Apply search filter
        const searchLower = searchTerm.toLowerCase();
        return (
          d.supplier.toLowerCase().includes(searchLower) ||
          d.orderId.toLowerCase().includes(searchLower) ||
          d.orderId.replace('AG ', '').includes(searchTerm) || // Search by number only
          (d.contact && d.contact.toLowerCase().includes(searchLower))
        );
      });

      // Get products for selected delivery
      const getCurrentProducts = () => {
        if (!selectedDelivery) {
          // Default to first order with products
          return orderProducts['239592'].map(p => getProductDetails(p.id, p.name, p.supplierName, p.ordered, p.pos, p.variant));
        }
        const orderId = selectedDelivery.orderId;
        const orderIdShort = orderId.replace('AG ', '');
        const orderProductList = orderProducts[orderIdShort] || [];
        
        // Filter out already booked positions
        const unbookedProducts = orderProductList.filter(p => {
          const isBooked = isPositionBooked(orderId, p.pos);
          console.log(`Position ${p.pos} (${p.name}): ${isBooked ? 'BOOKED' : 'UNBOOKED'}`);
          return !isBooked;
        });
        
        console.log(`Order ${orderId}: ${unbookedProducts.length}/${orderProductList.length} positions unbooked`);
        
        return unbookedProducts.map(p => getProductDetails(p.id, p.name, p.supplierName, p.ordered, p.pos, p.variant));
      };

      const currentProducts = getCurrentProducts();

      const handleDeliveryClick = (delivery) => {
        setSelectedDelivery(delivery);
        setCurrentScreen('order-detail');
      };

      const handleProductClick = (product) => {
        setSelectedProduct(product);
        setQuantity(product.ordered);
        
        // Smart split suggestion based on BinMax
        const suggestedSplit = Math.min(
          product.primaryLocation.binMax || 100,
          product.ordered
        );
        setSplitQtyPrimary(suggestedSplit);
        
        setCurrentScreen('product-detail');
      };

      const handleQuantityConfirm = () => {
        const ordered = selectedProduct.ordered;
        const difference = quantity - ordered;
        
        // SZENARIO A: UNTERLIEFERUNG (Teillieferung)
        if (difference < 0) {
          // Bestellt 100, Geliefert 60 → Kein Dialog, einfach weiter (SPEED!)
          console.log(`Unterlieferung: ${quantity}/${ordered} (${difference})`);
          
          // Only create task if none exists for this order yet
          const existingTask = purchasingTasks.find(t => 
            t.orderId === selectedDelivery.orderId && 
            t.type === 'underdelivery'
          );
          
          if (!existingTask) {
            // Create purchasing task for buyer
            const task = {
              id: Date.now(),
              type: 'underdelivery',
              orderId: selectedDelivery.orderId,
              supplier: selectedDelivery.supplier,
              product: selectedProduct.name,
              productData: selectedProduct, // ← Store complete product info
              ordered: ordered,
              received: quantity,
              difference: difference,
              status: 'PARTIALLY_RECEIVED',
              created: new Date().toLocaleString('de-DE')
            };
            setPurchasingTasks(prev => [...prev, task]);
          }
          
          // Proceed directly to VPE split - NO DIALOG!
          proceedToVpeSplit();
          return;
        }
        
        // SZENARIO B: ÜBERLIEFERUNG (Zu viel geliefert)
        if (difference > 0) {
          // Bestellt 100, Geliefert 110 → Warnung zeigen
          setModalType('overdelivery');
          setShowModal(true);
          return;
        }
        
        // Menge stimmt exakt
        proceedToVpeSplit();
      };

      const proceedToVpeSplit = () => {
        // Initialize VPE quantities with one empty field
        setVpeQuantities([0]);
        setModalType('vpe-split');
        setShowModal(true);
      };
      
      const handleOverdeliveryDecision = (decision) => {
        const ordered = selectedProduct.ordered;
        const difference = quantity - ordered;
        
        // Create purchasing task for buyer
        const task = {
          id: Date.now(),
          type: 'overdelivery',
          orderId: selectedDelivery.orderId,
          product: selectedProduct.name,
          ordered: ordered,
          received: quantity,
          difference: difference,
          decision: decision, // 'all' or 'separate'
          status: 'OVERDELIVERY_PENDING',
          created: new Date().toLocaleString('de-DE')
        };
        setPurchasingTasks(prev => [...prev, task]);
        
        setOverdeliveryDecision(decision);
        setShowModal(false);
        
        if (decision === 'separate') {
          // Create 2 separate VPEs: ordered + overhang
          const vpe1 = {
            id: 1,
            qty: ordered,
            lpn: generateLPN(selectedDelivery.orderId, 1),
            destination: 'LAGERPLATZ',
            warehouse: selectedDelivery?.warehouse || 'HQ',
            variant: selectedProduct?.variant || null
          };
          const vpe2 = {
            id: 2,
            qty: difference,
            lpn: generateLPN(selectedDelivery.orderId, 2),
            destination: 'KLÄRPLATZ',
            warehouse: selectedDelivery?.warehouse || 'HQ',
            variant: selectedProduct?.variant || null
          };
          
          setVpeUnits([vpe1, vpe2]);
          
          // Check if demo product (ID -1) → Skip labels, go directly to delivery note
          const isDemoProduct = selectedProduct && selectedProduct.id === -1;
          
          // Show next step with timeout to ensure state updates
          setTimeout(() => {
            setModalType(isDemoProduct ? 'delivery-note' : 'labels');
            setShowModal(true);
          }, 300);
        } else {
          // 'all' - normal VPE split with full quantity
          proceedToVpeSplit();
        }
      };

      const handleQuantityDeviationDecision = (action) => {
        if (action === 'update-order') {
          // User wants to update the order quantity
          selectedProduct.ordered = quantity;
          setShowModal(false);
          proceedToVpeSplit();
        } else if (action === 'partial-delivery') {
          // User confirms partial delivery
          setShowModal(false);
          proceedToVpeSplit();
        } else if (action === 'notify-orderer') {
          // Send notification to orderer
          setShowModal(false);
          setModalType('notify-orderer');
          setTimeout(() => setShowModal(true), 200);
        } else {
          // Cancel - go back to quantity input
          setShowModal(false);
        }
      };

      const handleNotifyOrderer = (message) => {
        // Simulate sending email - in real app this would call an API
        console.log('Sending notification:', message);
        
        // Show success feedback
        alert(`✉️ Nachricht wurde an ${selectedDelivery.contact || 'Einkauf'} gesendet!`);
        
        // Close modal and return to quantity input
        setShowModal(false);
      };

      const handleBookDelivery = () => {
        // Check if this order already has a delivery note
        const orderId = selectedDelivery.orderId;
        const existingNote = getDeliveryNote(orderId);
        const isDemoProduct = selectedProduct && selectedProduct.id === -1;
        
        // NEUE LOGIK: Wenn deliveryNote bereits hochgeladen wurde (in order-detail), direkt buchen!
        if (deliveryNote || existingNote) {
          console.log('📸 Delivery note vorhanden - DIREKT BUCHEN ohne Modals!');
          
          // Setze deliveryNote falls nicht gesetzt
          if (!deliveryNote && existingNote) {
            setDeliveryNote(existingNote);
          }
          
          // DIREKT BUCHEN ohne weitere Modals
          handleFinalBooking();
          return;
        }
        
        // ALT: Delivery note noch nicht vorhanden → Modal anzeigen
        if (isDemoProduct) {
          // Demo product: Book directly
          console.log('🎭 DEMO PRODUCT - booking directly');
          setShowModal(false);
          setTimeout(() => {
            handleFinalBooking();
          }, 200);
        } else {
          // First position of this order - show delivery note upload modal
          console.log('📸 First position - requesting delivery note upload');
          setShowModal(false);
          setModalType('delivery-note');
          setTimeout(() => setShowModal(true), 200);
        }
      };

      const handleDeliveryNoteConfirm = () => {
        // Check if demo product (ID -1) → Book directly without confirmation modal
        const isDemoProduct = selectedProduct && selectedProduct.id === -1;
        
        if (isDemoProduct) {
          console.log('🎭 DEMO PRODUCT - booking directly after delivery note');
          setShowModal(false);
          // Book directly
          setTimeout(() => {
            handleFinalBooking();
          }, 200);
        } else {
          // Normal flow: Show final confirmation modal
          setShowModal(false);
          setModalType('confirm-booking');
          setTimeout(() => setShowModal(true), 200);
        }
      };

      const handleFinalBooking = () => {
        const orderId = selectedDelivery.orderId;
        const orderIdShort = orderId.replace('AG ', '');
        
        // Get warehouse from delivery (ERP has already assigned it), default to HQ
        const targetWarehouse = selectedDelivery.warehouse || 'HQ';
        const targetWarehouseName = WAREHOUSES[targetWarehouse].name;
        
        // Get position number from selected product
        const positionNumber = selectedProduct ? selectedProduct.pos : 1;
        
        // Get total positions for this order
        const totalPositions = (orderProducts[orderIdShort] || selectedDelivery.products || []).length;
        
        console.log('📦 Booking position:', positionNumber, 'of order:', orderId);
        console.log('   Total positions:', totalPositions);
        console.log('   Booked quantity:', quantity, 'of', selectedProduct.ordered);
        
        // Check if this is a PARTIAL delivery (quantity < ordered)
        const isPartialQuantity = quantity < selectedProduct.ordered;
        
        // Update order booking status
        const currentStatus = orderBookingStatus[orderId] || {
          bookedPositions: [],
          totalPositions: totalPositions,
          deliveryNote: null,
          vpeCounter: 0  // ← NEU: VPE counter über alle Positionen
        };
        
        // Mark this position as booked
        if (!currentStatus.bookedPositions.includes(positionNumber)) {
          currentStatus.bookedPositions.push(positionNumber);
        }
        
        // Increment VPE counter by number of VPEs created
        currentStatus.vpeCounter = (currentStatus.vpeCounter || 0) + vpeUnits.length;
        console.log('   VPE Counter updated:', currentStatus.vpeCounter);
        
        // Store delivery note if provided (only store once per order)
        if (deliveryNote && !currentStatus.deliveryNote) {
          currentStatus.deliveryNote = deliveryNote;
        }
        
        // Update order booking status
        const newOrderBookingStatus = {
          ...orderBookingStatus,
          [orderId]: currentStatus
        };
        setOrderBookingStatus(newOrderBookingStatus);
        
        // Calculate order status
        const bookedCount = currentStatus.bookedPositions.length;
        // Order is PARTIAL if:
        // 1. Not all positions booked yet, OR
        // 2. Quantity is less than ordered (underdelivery)
        const isPartial = (bookedCount > 0 && bookedCount < totalPositions) || isPartialQuantity;
        const isComplete = bookedCount === totalPositions && !isPartialQuantity;
        
        console.log('   Booked positions:', currentStatus.bookedPositions);
        console.log('   Is partial quantity?:', isPartialQuantity);
        console.log('   Status:', isPartial ? 'PARTIAL' : isComplete ? 'COMPLETE' : 'OPEN');
        
        // Check if this is demo product (ID -1) → direct to Sonderlagerplatz
        const isDemoProduct = selectedProduct && selectedProduct.id === -1;
        
        if (isDemoProduct) {
          console.log('🎭 DEMO PRODUCT detected - booking directly to SONDERLAGERPLATZ');
          
          // Book VPEs directly to SONDERLAGERPLATZ
          vpeUnits.forEach(vpe => {
            const newInventoryItem = {
              type: 'BuyingPart',
              id: selectedProduct.id.toString(),
              productName: selectedProduct.name,
              variant: selectedProduct.variant || '0',
              supplier: selectedDelivery.supplier || '',
              storage: 'SONDERLAGERPLATZ',
              onStock: vpe.qty,
              lpn: vpe.lpn,
              isPrimary: false,
              blocked: false,
              blockedReason: null,
              warehouse: targetWarehouse
            };
            setInventoryItems(prev => [...prev, newInventoryItem]);
          });
          
          // Only remove from incoming if complete
          if (isComplete) {
            setIncomingDeliveries(prev => prev.filter(d => d.orderId !== orderId));
            console.log('✓ Order complete - removed from incoming');
          } else {
            console.log('⚠️ Order partial - keeping in incoming');
          }
          
          // Show success message
          const statusText = isComplete ? 'Komplett gebucht' : isPartial ? `Teillieferung (${bookedCount}/${totalPositions})` : 'Gebucht';
          alert(`🎭 DEMO-WARE erfolgreich gebucht!\n📍 Sonderlagerplatz: ${targetWarehouseName}\n📊 ${vpeUnits.length} VPE direkt eingelagert\n📊 Status: ${statusText}`);
          
          // Reset states and return to dashboard
          setShowModal(false);
          setPdfOpened(false);
          setDeliveryNote(null);
          setVpeUnits([]);
          setOverdeliveryDecision(null);
          setCurrentScreen('incoming-orders');
          return;  // Skip normal flow
        }
        
        // NORMAL FLOW: Create received order entry (for this position only)
        const bookedOrder = {
          ...selectedDelivery,
          receivedDate: new Date().toLocaleDateString('de-DE'),
          receivedQuantity: quantity,
          vpeCount: vpeUnits.length,
          vpeUnits: vpeUnits,
          hasDeliveryNote: !!currentStatus.deliveryNote,
          deliveryNoteImage: currentStatus.deliveryNote,
          productName: selectedProduct ? selectedProduct.name : 'Unbekanntes Produkt',
          productId: selectedProduct ? selectedProduct.id : null,
          productVariant: selectedProduct ? selectedProduct.variant : null,  // ← NEU: Variante
          positionNumber: positionNumber,
          warehouse: targetWarehouse,
          warehouseName: targetWarehouseName,
          // Order status flags
          isPartialDelivery: isPartial,
          isCompleteDelivery: isComplete,
          orderProgress: `${bookedCount}/${totalPositions}`,
          // NEW: Track if quantity was partial
          isPartialQuantity: isPartialQuantity,
          orderedQuantity: selectedProduct.ordered
        };
        
        setReceivedOrders([...receivedOrders, bookedOrder]);
        
        // Add audit log entry for each VPE booked
        vpeUnits.forEach(vpe => {
          addAuditLogEntry({
            action: 'BOOK',
            lpn: vpe.lpn,
            articleId: selectedProduct.id,
            articleName: selectedProduct.name,
            fromLocation: 'Wareneingang',
            toLocation: vpe.destination,
            quantity: vpe.qty,
            reason: `Wareneingang Order ${orderId}, Position ${positionNumber}`
          });
        });
        
        // Check if this is a BACKORDER completion - resolve original task
        if (selectedDelivery.isBackorder && selectedDelivery.originalOrderId && isComplete) {
          console.log('🔵 Backorder completed! Resolving original task for:', selectedDelivery.originalOrderId);
          
          // Find and resolve the backorder task
          setPurchasingTasks(prev => prev.map(task => {
            if (task.orderId === selectedDelivery.originalOrderId && task.status === 'BACKORDER') {
              console.log('🔵 Found backorder task, marking as RESOLVED');
              return { ...task, status: 'RESOLVED', resolution: `Backorder ${orderId} erfolgreich gebucht` };
            }
            return task;
          }));
          
          // Update the original order in receivedOrders to remove PARTIAL status
          setReceivedOrders(prev => prev.map(order => {
            if (order.orderId === selectedDelivery.originalOrderId) {
              console.log('🔵 Updating original order status to remove partial flag');
              return {
                ...order,
                isPartialQuantity: false, // Remove partial quantity flag
                backorderResolved: true,
                backorderCompletedId: orderId
              };
            }
            return order;
          }));
        }
        
        // Only remove from incoming if complete
        if (isComplete) {
          setIncomingDeliveries(prev => prev.filter(d => d.orderId !== orderId));
          console.log('✓ Order complete - removed from incoming');
        } else {
          console.log('⚠️ Order partial - keeping in incoming');
          
          // UPDATE: Bei Teilbuchung die Order in incoming aktualisieren!
          setIncomingDeliveries(prev => prev.map(delivery => {
            if (delivery.orderId === orderId) {
              // Hole die Produktliste - entweder aus delivery.products oder aus orderProducts
              const orderIdShort = orderId.replace('AG ', '');
              const productsList = delivery.products && delivery.products.length > 0 
                ? delivery.products 
                : orderProducts[orderIdShort] || [];
              
              // Update products array mit alreadyReceived Info
              const updatedProducts = productsList.map(p => {
                if (p.pos === positionNumber || (!p.pos && positionNumber === 1)) {
                  // Dieses Produkt wurde gerade gebucht
                  const currentAlreadyReceived = p.alreadyReceived || 0;
                  const originalOrdered = p.originalOrdered || p.ordered;
                  const newAlreadyReceived = currentAlreadyReceived + quantity;
                  const newOrdered = originalOrdered - newAlreadyReceived;
                  
                  console.log(`📊 Updating product ${p.name}:`);
                  console.log(`   Original ordered: ${originalOrdered}`);
                  console.log(`   Already received: ${currentAlreadyReceived} → ${newAlreadyReceived}`);
                  console.log(`   Still open: ${newOrdered}`);
                  
                  return {
                    ...p,
                    originalOrdered: originalOrdered,
                    alreadyReceived: newAlreadyReceived,
                    ordered: newOrdered
                  };
                }
                return p;
              });
              
              return {
                ...delivery,
                products: updatedProducts
              };
            }
            return delivery;
          }));
          
          console.log('✓ Updated incoming delivery with alreadyReceived info');
        }
        
        // Show success message
        const statusText = isComplete ? 'Komplett gebucht' : isPartial ? `Teillieferung (${bookedCount}/${totalPositions}${isPartialQuantity ? ', Menge unvollständig' : ''})` : 'Gebucht';
        alert(`✓ Position ${positionNumber} erfolgreich gebucht!\n📍 Ziellager: ${targetWarehouseName}\n📊 Status: ${statusText}`);
        
        // Check replenishment needs after booking
        setTimeout(() => {
          checkReplenishment();
        }, 500);
        
        // Reset states and return to dashboard
        setShowModal(false);
        setPdfOpened(false);
        setDeliveryNote(null);
        setVpeUnits([]);
        setOverdeliveryDecision(null);
        setCurrentScreen('incoming-orders');
      };

      const handleVpeSplitConfirm = () => {
        // If we're in overdelivery separate mode, VPEs are already set - don't regenerate!
        if (overdeliveryDecision === 'separate' && vpeUnits.length > 0) {
          setShowModal(false);
          setTimeout(() => {
            setModalType('labels');
            setShowModal(true);
          }, 300);
          return;
        }
        
        // Validate that sum of quantities equals total
        const sum = vpeQuantities.reduce((a, b) => a + b, 0);
        if (sum !== quantity) {
          alert(`Fehler: Summe (${sum.toLocaleString()} Stk) muss ${quantity.toLocaleString()} Stk ergeben!`);
          return;
        }
        
        // Create VPE units from entered quantities
        const units = [];
        const orderId = selectedDelivery ? selectedDelivery.orderId : 'AG 000000';
        
        // Get current VPE counter for this order
        const currentVpeCounter = orderBookingStatus[orderId]?.vpeCounter || 0;
        console.log('📦 Current VPE Counter for', orderId, ':', currentVpeCounter);
        
        vpeQuantities.forEach((qty, index) => {
          if (qty > 0) { // Only add non-zero quantities
            const vpeNumber = currentVpeCounter + index + 1;  // ← Use order counter!
            units.push({
              id: index + 1,
              qty: qty,
              lpn: generateLPN(orderId, vpeNumber),
              warehouse: selectedDelivery?.warehouse || 'HQ',  // ← Store warehouse info
              variant: selectedProduct?.variant || null  // ← Store variant!
            });
            console.log('  VPE', vpeNumber, ':', generateLPN(orderId, vpeNumber));
          }
        });
        
        setVpeUnits(units);
        setShowModal(false);
        
        // Check if this is an overdelivery that needs overhang selection
        const isOverdelivery = selectedProduct && quantity > selectedProduct.ordered;
        
        if (isOverdelivery && overdeliveryDecision === 'all') {
          // User chose "Alles einlagern" - let them mark overhang VPEs
          const overhang = quantity - selectedProduct.ordered;
          
          // Smart suggestion: Find smallest VPE(s) that together equal or exceed overhang
          const sortedUnits = [...units].sort((a, b) => a.qty - b.qty); // Smallest first
          const suggested = [];
          let sum = 0;
          
          for (const unit of sortedUnits) {
            if (sum >= overhang) break;
            suggested.push(unit.id);
            sum += unit.qty;
          }
          
          setSelectedOverhangVPEs(suggested);
          
          // Show overhang selection modal
          setTimeout(() => {
            setShowModal(true);
            setModalType('overhang-selection');
          }, 300);
        } else {
          // Check if demo product (ID -1) → Skip labels, go directly to delivery note
          const isDemoProduct = selectedProduct && selectedProduct.id === -1;
          
          if (isDemoProduct) {
            console.log('🎭 DEMO PRODUCT detected - skipping labels, going to delivery note');
            setTimeout(() => {
              setShowModal(true);
              setModalType('delivery-note');
            }, 300);
          } else {
            // Normal flow: Show label preview directly
            setTimeout(() => {
              setShowModal(true);
              setModalType('labels');
            }, 300);
          }
        }
      };
      
      const handleVpeQuantityChange = (index, value) => {
        const newQuantities = [...vpeQuantities];
        newQuantities[index] = parseInt(value) || 0;
        setVpeQuantities(newQuantities);
      };
      
      const handleVpeFieldBlur = (index) => {
        // Add new field when user leaves current field (if needed)
        const sum = vpeQuantities.reduce((a, b) => a + b, 0);
        const currentValue = vpeQuantities[index];
        
        if (sum < quantity && index === vpeQuantities.length - 1 && currentValue > 0) {
          setVpeQuantities(prev => [...prev, 0]);
        }
      };
      
      const handleVpeFieldKeyPress = (e, index) => {
        // Add new field when user presses Enter (if needed)
        if (e.key === 'Enter') {
          const sum = vpeQuantities.reduce((a, b) => a + b, 0);
          const currentValue = vpeQuantities[index];
          
          if (sum < quantity && index === vpeQuantities.length - 1 && currentValue > 0) {
            setVpeQuantities(prev => [...prev, 0]);
            // Focus next field after a short delay
            setTimeout(() => {
              const nextInput = document.querySelector(`input[data-vpe-index="${index + 1}"]`);
              if (nextInput) nextInput.focus();
            }, 50);
          }
        }
      };
      
      const handleRemoveVpeField = (index) => {
        if (vpeQuantities.length > 1) {
          const newQuantities = vpeQuantities.filter((_, i) => i !== index);
          setVpeQuantities(newQuantities);
        }
      };
      
      // Check replenishment needs
      const checkReplenishment = () => {
        console.log('🔍 === REPLENISHMENT CHECK START ===');
        console.log('📊 Inventory Items:', inventoryItems.length);
        
        const newTasks = [];
        const newMessages = [];
        
        // Group inventory by product
        const productGroups = {};
        inventoryItems.forEach(item => {
          const key = `${item.id}-${item.productName}-${item.variant}`;
          if (!productGroups[key]) {
            productGroups[key] = {
              id: item.id,
              productName: item.productName,
              variant: item.variant,
              minStockMainLocation: item.minStockMainLocation,
              mainLocation: item.mainLocation,
              locations: []
            };
          }
          productGroups[key].locations.push({
            storage: item.storage,
            onStock: item.onStock,
            lpn: item.lpn,
            isPrimary: item.isPrimary
          });
        });
        
        console.log('📦 Product Groups:', Object.keys(productGroups).length);
        
        // Check each product
        Object.values(productGroups).forEach(product => {
          console.log('---');
          console.log('🔍 Checking product:', product.productName);
          console.log('  ID:', product.id);
          console.log('  Min Stock Main Location:', product.minStockMainLocation);
          console.log('  Main Location:', product.mainLocation);
          console.log('  Locations:', product.locations);
          
          if (!product.minStockMainLocation || !product.mainLocation) {
            console.log('  ⏭️ SKIP: No min stock or main location defined');
            return;
          }
          
          // Find main location stock
          const mainLoc = product.locations.find(loc => loc.storage === product.mainLocation);
          const mainStock = mainLoc ? mainLoc.onStock : 0;
          
          console.log('  📍 Main Location Stock:', mainStock);
          console.log('  📊 Min Required:', product.minStockMainLocation);
          
          // Check if below minimum
          if (mainStock < product.minStockMainLocation) {
            const shortage = product.minStockMainLocation - mainStock;
            console.log('  ⚠️ BELOW MINIMUM! Shortage:', shortage);
            
            // Check if task already exists
            const existingTask = replenishmentTasks.find(t => 
              t.productId === product.id && 
              t.productName === product.productName &&
              t.status === 'PENDING'
            );
            
            console.log('  🔍 Existing task?', existingTask ? 'YES' : 'NO');
            
            if (!existingTask) {
              // Find reserve location (not main location, has stock)
              const reserveLoc = product.locations.find(loc => 
                loc.storage !== product.mainLocation && loc.onStock > 0
              );
              
              console.log('  📦 Reserve Location:', reserveLoc);
              
              if (reserveLoc) {
                // Create replenishment task
                const task = {
                  id: Date.now() + Math.random(),
                  type: 'replenishment',
                  productId: product.id,
                  productName: product.productName,
                  variant: product.variant,
                  from: reserveLoc.storage,
                  fromLPN: reserveLoc.lpn,
                  to: product.mainLocation,
                  qtyNeeded: shortage,
                  qtyAvailable: reserveLoc.onStock,
                  status: 'PENDING',
                  created: new Date().toLocaleString('de-DE')
                };
                newTasks.push(task);
                console.log('  ✅ TASK CREATED:', task);
                
                // Create message for warehouse
                const message = {
                  id: Date.now() + Math.random(),
                  type: 'warning',
                  title: 'Nachschub erforderlich',
                  message: `${product.productName}: ${shortage} Stk von ${reserveLoc.storage} nach ${product.mainLocation} umlagern`,
                  productId: product.id,
                  productName: product.productName,
                  from: reserveLoc.storage,
                  to: product.mainLocation,
                  quantity: shortage,
                  read: false,
                  created: new Date().toLocaleString('de-DE')
                };
                newMessages.push(message);
                console.log('  ✅ MESSAGE CREATED:', message);
              } else {
                console.log('  ❌ NO RESERVE LOCATION FOUND');
              }
            } else {
              console.log('  ⏭️ SKIP: Task already exists');
            }
          } else {
            console.log('  ✅ STOCK OK (above minimum)');
          }
        });
        
        console.log('---');
        console.log('📊 SUMMARY:');
        console.log('  New Tasks:', newTasks.length);
        console.log('  New Messages:', newMessages.length);
        
        // Add new tasks and messages
        if (newTasks.length > 0) {
          setReplenishmentTasks(prev => {
            console.log('  💾 Adding tasks. Previous count:', prev.length);
            return [...prev, ...newTasks];
          });
          setMessages(prev => {
            console.log('  💾 Adding messages. Previous count:', prev.length);
            return [...newMessages, ...prev];
          });
          console.log(`✅ ${newTasks.length} Nachschub-Task(s) erstellt`);
        } else {
          console.log('ℹ️ No tasks created');
        }
        
        console.log('🔍 === REPLENISHMENT CHECK END ===');
      };
      
      const handleOverhangSelectionToggle = (vpeId) => {
        setSelectedOverhangVPEs(prev => {
          if (prev.includes(vpeId)) {
            return prev.filter(id => id !== vpeId);
          } else {
            return [...prev, vpeId];
          }
        });
      };
      
      const handleOverhangSelectionConfirm = () => {
        // Mark selected VPEs with KLÄRPLATZ, rest with LAGERPLATZ
        // If nothing selected, all get LAGERPLATZ
        setVpeUnits(prev => prev.map(vpe => ({
          ...vpe,
          destination: selectedOverhangVPEs.includes(vpe.id) ? 'KLÄRPLATZ' : 'LAGERPLATZ'
        })));
        
        // Check if demo product (ID -1) → Skip labels, go directly to delivery note
        const isDemoProduct = selectedProduct && selectedProduct.id === -1;
        
        // Close modal and show next step
        setShowModal(false);
        setTimeout(() => {
          setShowModal(true);
          setModalType(isDemoProduct ? 'delivery-note' : 'labels');
        }, 300);
      };

      const handleSplitDecision = (shouldSplit) => {
        if (shouldSplit) {
          setShowModal(true);
          setModalType('split');
        } else {
          // Directly to primary location
          showLabelPreview(false);
        }
      };

      const showLabelPreview = (isSplit) => {
        setShowModal(true);
        setModalType('labels');
      };

      const handleShip = (orderId) => {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'shipping' } : order
        ));
        
        setTimeout(() => {
          setOrders(orders.map(order => 
            order.id === orderId ? { ...order, status: 'shipped' } : order
          ));
          
          setTimeout(() => {
            setOrders(orders.filter(order => order.id !== orderId));
            // Remove from picking orders as well
            setPickingOrders(prev => prev.filter(po => po.orderId !== orderId));
          }, 1000);
        }, 1500);
      };

      const handleConfirmWarning = (selectedOrder) => {
        if (!selectedOrder) {
          setShowModal(false);
          return;
        }
        
        // Extract product ID from product string (e.g., "27x Sicherheitsnadeln [113]" -> 113)
        const productIdMatch = selectedOrder.product.match(/\[(\d+)\]/);
        const productId = productIdMatch ? productIdMatch[1] : null;
        
        if (!productId) {
          alert('⚠️ Fehler: Produkt-ID nicht gefunden!');
          setShowModal(false);
          return;
        }
        
        // Extract quantity from product string (e.g., "27x Sicherheitsnadeln" -> 27)
        const qtyMatch = selectedOrder.product.match(/^(\d+)x/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 0;
        
        // Always use alternative location (main location is empty!)
        const alternativeCode = selectedOrder.alternativeLocation?.code;
        
        if (!alternativeCode) {
          alert('⚠️ Fehler: Keine Alternative verfügbar!');
          setShowModal(false);
          return;
        }
        
        // Update inventory - reduce stock from alternative location
        setInventoryItems(prev => prev.map(inv => {
          if (inv.id === productId && inv.storage === alternativeCode) {
            return {
              ...inv,
              onStock: Math.max(0, inv.onStock - quantity)
            };
          }
          return inv;
        }));
        
        // Always create task for warehouse staff to refill main location
        const newMessage = {
          id: Date.now(),
          type: 'refill-required',
          title: `📦 ${selectedOrder.location.code} nachfüllen erforderlich`,
          message: `Order ${selectedOrder.id} für ${selectedOrder.customer}\n\n` +
            `Hauptlager ${selectedOrder.location.code} war leer (0 Stk).\n` +
            `Ware wurde von Alternative ${alternativeCode} entnommen.\n\n` +
            `AKTION ERFORDERLICH:\n` +
            `• ${selectedOrder.location.code} von ${alternativeCode} nachfüllen\n` +
            `• Mindestbestand prüfen und anpassen\n` +
            `• Bei Bedarf Nachbestellung auslösen`,
          timestamp: new Date().toLocaleString('de-DE'),
          read: false,
          priority: 'high'
        };
        setMessages(prev => [newMessage, ...prev]);
        
        // Close modal and ship the order
        setShowModal(false);
        
        // Ship the order
        setTimeout(() => {
          handleShip(selectedOrder.id);
        }, 300);
      };

      const handleTaskComplete = (taskId) => {
        setTasks(tasks.filter(t => t.id !== taskId));
      };

      return (
        <div>
          {currentView === 'warehouse' ? (
            <WarehouseView 
              currentView={currentView}
              setCurrentView={setCurrentView}
              setCurrentScreen={setCurrentScreen}
              currentScreen={currentScreen}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filteredDeliveries={filteredDeliveries}
              selectedDelivery={selectedDelivery}
              setSelectedDelivery={setSelectedDelivery}
              products={currentProducts}
              selectedProduct={selectedProduct}
              handleDeliveryClick={handleDeliveryClick}
              handleProductClick={handleProductClick}
              quantity={quantity}
              setQuantity={setQuantity}
              handleQuantityConfirm={handleQuantityConfirm}
              handleSplitDecision={handleSplitDecision}
              showModal={showModal}
              setShowModal={setShowModal}
              modalType={modalType}
              setModalType={setModalType}
              splitQtyPrimary={splitQtyPrimary}
              setSplitQtyPrimary={setSplitQtyPrimary}
              showLabelPreview={showLabelPreview}
              tasks={tasks}
              handleTaskComplete={handleTaskComplete}
              vpeSize={vpeSize}
              setVpeSize={setVpeSize}
              vpeUnits={vpeUnits}
              setVpeUnits={setVpeUnits}
              handleQuantityDeviationDecision={handleQuantityDeviationDecision}
              handleNotifyOrderer={handleNotifyOrderer}
              handleVpeSplitConfirm={handleVpeSplitConfirm}
              vpeQuantities={vpeQuantities}
              setVpeQuantities={setVpeQuantities}
              handleVpeQuantityChange={handleVpeQuantityChange}
              handleVpeFieldBlur={handleVpeFieldBlur}
              handleVpeFieldKeyPress={handleVpeFieldKeyPress}
              handleRemoveVpeField={handleRemoveVpeField}
              selectedOverhangVPEs={selectedOverhangVPEs}
              handleOverhangSelectionToggle={handleOverhangSelectionToggle}
              handleOverhangSelectionConfirm={handleOverhangSelectionConfirm}
              pdfOpened={pdfOpened}
              setPdfOpened={setPdfOpened}
              deliveryNote={deliveryNote}
              setDeliveryNote={setDeliveryNote}
              handleBookDelivery={handleBookDelivery}
              handleDeliveryNoteConfirm={handleDeliveryNoteConfirm}
              handleFinalBooking={handleFinalBooking}
              receivedOrders={receivedOrders}
              setReceivedOrders={setReceivedOrders}
              relocationOrders={relocationOrders}
              setRelocationOrders={setRelocationOrders}
              assignedVPEs={assignedVPEs}
              setAssignedVPEs={setAssignedVPEs}
              inventoryItems={inventoryItems}
              setInventoryItems={setInventoryItems}
              pickingOrders={pickingOrders}
              setPickingOrders={setPickingOrders}
              showQualitySplit={showQualitySplit}
              setShowQualitySplit={setShowQualitySplit}
              qualityOkQty={qualityOkQty}
              setQualityOkQty={setQualityOkQty}
              qualityDefectQty={qualityDefectQty}
              setQualityDefectQty={setQualityDefectQty}
              qualityReason={qualityReason}
              setQualityReason={setQualityReason}
              qualityPhoto={qualityPhoto}
              setQualityPhoto={setQualityPhoto}
              proceedToVpeSplit={proceedToVpeSplit}
              setPurchasingTasks={setPurchasingTasks}
              handleOverdeliveryDecision={handleOverdeliveryDecision}
              incomingDeliveries={incomingDeliveries}
              setIncomingDeliveries={setIncomingDeliveries}
              returnTasks={returnTasks}
              setReturnTasks={setReturnTasks}
              messages={messages}
              setMessages={setMessages}
              selectedInventoryItem={selectedInventoryItem}
              setSelectedInventoryItem={setSelectedInventoryItem}
              showInventoryEdit={showInventoryEdit}
              setShowInventoryEdit={setShowInventoryEdit}
              replenishmentTasks={replenishmentTasks}
              setReplenishmentTasks={setReplenishmentTasks}
              checkReplenishment={checkReplenishment}
              selectedWarehouse={selectedWarehouse}
              setSelectedWarehouse={setSelectedWarehouse}
              orderBookingStatus={orderBookingStatus}
              setOrderBookingStatus={setOrderBookingStatus}
              getOrderStatus={getOrderStatus}
              getOrderProgress={getOrderProgress}
              isPositionBooked={isPositionBooked}
              hasDeliveryNote={hasDeliveryNote}
              getDeliveryNote={getDeliveryNote}
              orderProducts={orderProducts}
              getProductDetails={getProductDetails}
              incomingWarehouseFilter={incomingWarehouseFilter}
              setIncomingWarehouseFilter={setIncomingWarehouseFilter}
              distributionSearch={distributionSearch}
              setDistributionSearch={setDistributionSearch}
              relocationSearch={relocationSearch}
              setRelocationSearch={setRelocationSearch}
              transferSearch={transferSearch}
              setTransferSearch={setTransferSearch}
              auditLog={auditLog}
              setAuditLog={setAuditLog}
              auditLogFilter={auditLogFilter}
              setAuditLogFilter={setAuditLogFilter}
              addAuditLogEntry={addAuditLogEntry}
              assignLocationModal={assignLocationModal}
              setAssignLocationModal={setAssignLocationModal}
              pickingSortMode={pickingSortMode}
              setPickingSortMode={setPickingSortMode}
            />
          ) : currentView === 'shipping' ? (
            <ShippingView 
              currentView={currentView}
              setCurrentView={setCurrentView}
              setCurrentScreen={setCurrentScreen}
              orders={orders}
              pickingOrders={pickingOrders}
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              handleShip={handleShip}
              showModal={showModal}
              setShowModal={setShowModal}
              modalType={modalType}
              setModalType={setModalType}
              handleConfirmWarning={handleConfirmWarning}
            />
          ) : (
            <PurchasingView 
              currentView={currentView}
              setCurrentView={setCurrentView}
              setCurrentScreen={setCurrentScreen}
              purchasingTasks={purchasingTasks}
              setPurchasingTasks={setPurchasingTasks}
              inventoryItems={inventoryItems}
              setInventoryItems={setInventoryItems}
              incomingDeliveries={incomingDeliveries}
              setIncomingDeliveries={setIncomingDeliveries}
              receivedOrders={receivedOrders}
              setReceivedOrders={setReceivedOrders}
              returnTasks={returnTasks}
              setReturnTasks={setReturnTasks}
              messages={messages}
              setMessages={setMessages}
              setOrderBookingStatus={setOrderBookingStatus}
            />
          )}
        </div>
      );
    }

    // Purchasing View Component
    function PurchasingView({ currentView, setCurrentView, setCurrentScreen, purchasingTasks, setPurchasingTasks, inventoryItems, setInventoryItems, incomingDeliveries, setIncomingDeliveries, receivedOrders, setReceivedOrders, returnTasks, setReturnTasks, messages, setMessages, setOrderBookingStatus }) {
      const handleTaskAction = (taskId, action) => {
        const task = purchasingTasks.find(t => t.id === taskId);
        
        if (task.type === 'underdelivery') {
          if (action === 'expect-rest') {
            // Generate new backorder ID in AG format (6 digits)
            const newBackorderNumber = Math.floor(100000 + Math.random() * 900000);
            const newBackorderId = `AG ${newBackorderNumber}`;
            
            console.log('🔵 STARTING BACKORDER CREATION');
            console.log('🔵 Task:', task);
            console.log('🔵 New Backorder ID:', newBackorderId);
            
            alert(`✓ PO bleibt offen.\n\nBackorder: ${Math.abs(task.difference)} Stück werden erwartet.\n\nNeue Order-ID: ${newBackorderId}`);
            
            // Update task status
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'BACKORDER', resolution: `Rest wird erwartet (${newBackorderId})` } : t
            ));
            
            // Add backorder note to received orders
            setReceivedOrders(prev => prev.map(order => {
              if (order.orderId === task.orderId) {
                return {
                  ...order,
                  backorderReference: newBackorderId,
                  backorderNote: `↗️ Backorder: ${newBackorderId}`
                };
              }
              return order;
            }));
            
            // Remove ORIGINAL order from incoming
            setIncomingDeliveries(prev => {
              console.log('🔵 Removing original order:', task.orderId);
              return prev.filter(d => d.orderId !== task.orderId);
            });
            
            // Create backorder product with simple structure
            const backorderProduct = {
              id: task.productData?.id || 147,
              name: task.productData?.name || task.product,
              supplierName: task.supplier || 'Unbekannt',
              ordered: Math.abs(task.difference),
              vpe: task.productData?.vpe || 12,
              vpeUnit: task.productData?.vpeUnit || 'Stück/Karton',
              primaryLocation: task.productData?.primaryLocation || { 
                code: 'DL-37', 
                zone: 'Drucklager',
                binMin: 0,
                binMax: 100,
                routingIndex: 100
              },
              reserveLocation: task.productData?.reserveLocation || { 
                code: 'PAT-1', 
                zone: 'Paternoster',
                routingIndex: 500
              },
              variant: task.productData?.variant || null,
              pos: 1,
              alreadyReceived: null,
              isBackorderProduct: false,
              status: 'Offen',
              emoji: '📦',
              booked: false
            };
            
            console.log('🔵 Backorder product:', backorderProduct);
            
            // Find original delivery
            const originalDelivery = incomingDeliveries.find(d => d.orderId === task.orderId);
            console.log('🔵 Original delivery:', originalDelivery);
            
            // Create NEW backorder delivery
            const backorder = {
              id: Date.now(),
              orderId: newBackorderId,
              supplier: task.supplier || 'Unbekannt',
              contact: originalDelivery?.contact || 'Felix',
              items: 1,
              deliveryDate: new Date().toLocaleDateString('de-DE'),
              priority: originalDelivery?.priority || 1,
              warehouse: originalDelivery?.warehouse || 'HQ',
              warehouseName: originalDelivery?.warehouseName,
              isBackorder: true,
              backorderQty: Math.abs(task.difference),
              originalOrderId: task.orderId,
              backorderNote: `↩️ Original: ${task.orderId} (Nachlieferung ${Math.abs(task.difference)} Stk)`,
              products: [backorderProduct]
            };
            
            console.log('🔵 Complete backorder object:', backorder);
            
            // Register backorder in orderBookingStatus as OPEN
            setOrderBookingStatus(prev => ({
              ...prev,
              [newBackorderId]: {
                totalPositions: 1,
                bookedPositions: [],
                deliveryNote: null
              }
            }));
            
            setIncomingDeliveries(prev => {
              const newDeliveries = [backorder, ...prev];
              console.log('🔵 New incoming deliveries:', newDeliveries);
              return newDeliveries;
            });
            
            console.log('🔵 BACKORDER CREATION COMPLETE');
          } else if (action === 'cancel-rest') {
            alert(`✓ PO wird geschlossen.\n\nStatus: "Closed Short"\n${Math.abs(task.difference)} Stück beim Lieferanten reklamiert.`);
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'CLOSED_SHORT', resolution: 'Rest storniert' } : t
            ));
          }
        } else if (task.type === 'overdelivery') {
          if (action === 'keep') {
            alert(`✓ Überlieferung akzeptiert.\n\nPO wird auf ${task.received} Stück angepasst.\n\nGesperrte Ware wird freigegeben.`);
            
            // Update task status
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'ACCEPTED', resolution: 'Behalten' } : t
            ));
            
            // Unlock inventory items from this order
            setInventoryItems(prev => prev.map(inv => {
              // Find items from this order that are blocked
              if (inv.lpn && inv.lpn.includes(task.orderId.replace('AG ', '')) && inv.blocked) {
                return { ...inv, blocked: false, blockedReason: null };
              }
              return inv;
            }));
            
            // Also update receivedOrders to remove KLÄRPLATZ destination
            setReceivedOrders(prev => prev.map(order => {
              if (order.orderId === task.orderId && order.vpeUnits) {
                return {
                  ...order,
                  vpeUnits: order.vpeUnits.map(vpe => ({
                    ...vpe,
                    destination: vpe.destination === 'KLÄRPLATZ' ? 'LAGERPLATZ' : vpe.destination
                  }))
                };
              }
              return order;
            }));
          } else if (action === 'return') {
            console.log('🔴 RETURN ACTION TRIGGERED');
            console.log('Task:', task);
            console.log('All receivedOrders:', receivedOrders);
            
            alert(`✓ Retourenschein wird erstellt.\n\n${task.difference} Stück gehen zurück an Lieferanten.\n\nLager-Task erstellt: Ware für Retoure vorbereiten.`);
            
            // Update purchasing task status
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'RETURN_INITIATED', resolution: 'Retoure eingeleitet' } : t
            ));
            
            // Find the overhang VPE(s) for this order
            const order = receivedOrders.find(o => o.orderId === task.orderId);
            console.log('🟡 Found order:', order);
            
            if (order && order.vpeUnits) {
              console.log('🟡 Order vpeUnits:', order.vpeUnits);
              order.vpeUnits.forEach((vpe, idx) => {
                console.log(`  VPE ${idx + 1}:`, {
                  id: vpe.id,
                  qty: vpe.qty,
                  lpn: vpe.lpn,
                  destination: vpe.destination
                });
              });
            }
            
            // Try to find KLÄRPLATZ VPE first (if "Überhang separieren" was chosen)
            let overhangVPEs = order?.vpeUnits?.filter(vpe => vpe.destination === 'KLÄRPLATZ') || [];
            
            // If no KLÄRPLATZ VPE found, calculate which VPEs contain the overhang
            if (overhangVPEs.length === 0 && order?.vpeUnits) {
              console.log('🔵 No KLÄRPLATZ VPE found, calculating overhang VPEs...');
              
              // The last VPE(s) that together equal the overhang quantity
              let overhangQty = task.difference;
              const tempVPEs = [];
              
              // Go from last VPE backwards
              for (let i = order.vpeUnits.length - 1; i >= 0 && overhangQty > 0; i--) {
                const vpe = order.vpeUnits[i];
                tempVPEs.unshift(vpe); // Add at beginning
                overhangQty -= vpe.qty;
              }
              
              overhangVPEs = tempVPEs;
              console.log('🔵 Calculated overhang VPEs:', overhangVPEs);
            }
            
            console.log('🟢 Overhang VPE(s):', overhangVPEs);
            
            if (overhangVPEs.length > 0) {
              // Create return task(s) for warehouse
              overhangVPEs.forEach(vpe => {
                const returnTask = {
                  id: Date.now() + Math.random(), // Unique ID
                  type: 'return',
                  orderId: task.orderId,
                  product: task.product,
                  supplier: task.supplier || order.supplier || 'Unbekannt',
                  lpn: vpe.lpn,
                  quantity: vpe.qty,
                  reason: 'Überlieferung - nicht bestellt',
                  status: 'PENDING',
                  created: new Date().toLocaleString('de-DE')
                };
                console.log('✅ Created return task:', returnTask);
                setReturnTasks(prev => [...prev, returnTask]);
                
                // Create message for warehouse staff
                const message = {
                  id: Date.now() + Math.random(),
                  type: 'return',
                  title: 'Retoure vorbereiten',
                  message: `VPE ${vpe.lpn} (${vpe.qty} Stk) zur Rücksendung vorbereiten`,
                  orderId: task.orderId,
                  product: task.product,
                  lpn: vpe.lpn,
                  quantity: vpe.qty,
                  read: false,
                  created: new Date().toLocaleString('de-DE')
                };
                setMessages(prev => [message, ...prev]);
                
                // Mark VPE as scheduled for return
                setReceivedOrders(prev => prev.map(o => {
                  if (o.orderId === task.orderId && o.vpeUnits) {
                    return {
                      ...o,
                      vpeUnits: o.vpeUnits.map(v => 
                        v.lpn === vpe.lpn 
                          ? { ...v, returnScheduled: true }
                          : v
                      )
                    };
                  }
                  return o;
                }));
              });
              console.log('✅ Marked VPE(s) for return');
            } else {
              console.error('❌ NO OVERHANG VPEs FOUND!');
            }
          }
        } else if (task.type === 'quality') {
          if (action === 'return') {
            alert(`✓ Reklamation wird eingeleitet.\n\n${task.defectQty} Stück defekte Ware geht zurück.`);
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'CLAIM_INITIATED', resolution: 'Retoure/Reklamation' } : t
            ));
            
            // Create message for warehouse staff - RETURN
            const returnMessage = {
              id: Date.now() + Math.random(),
              type: 'return',
              title: 'Qualitätsmangel - Retoure',
              message: `${task.defectQty} Stk defekte Ware zur Rückgabe an Lieferanten vorbereiten`,
              orderId: task.orderId,
              product: task.product,
              lpn: task.lpn || null,
              quantity: task.defectQty,
              read: false,
              created: new Date().toLocaleString('de-DE')
            };
            setMessages(prev => [returnMessage, ...prev]);
            
          } else if (action === 'write-off') {
            alert(`✓ Ware wird abgeschrieben.\n\n${task.defectQty} Stück werden vernichtet.\nBestandskorrektur auf 0.`);
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'WRITTEN_OFF', resolution: 'Abgeschrieben' } : t
            ));
            
            // Create message for warehouse staff - WRITE-OFF
            const writeOffMessage = {
              id: Date.now() + Math.random(),
              type: 'warning',
              title: 'Qualitätsmangel - Abschreiben',
              message: `${task.defectQty} Stk defekte Ware entsorgen und Bestand auf 0 korrigieren`,
              orderId: task.orderId,
              product: task.product,
              lpn: task.lpn || null,
              quantity: task.defectQty,
              read: false,
              created: new Date().toLocaleString('de-DE')
            };
            setMessages(prev => [writeOffMessage, ...prev]);
            
          } else if (action === 'b-ware') {
            alert(`✓ Als B-Ware freigegeben.\n\n${task.defectQty} Stück werden auf B-Ware-Artikel umgebucht.`);
            setPurchasingTasks(prev => prev.map(t => 
              t.id === taskId ? { ...t, status: 'B_WARE', resolution: 'Als B-Ware freigegeben' } : t
            ));
            
            // Create message for warehouse staff - B-WARE
            const bWareMessage = {
              id: Date.now() + Math.random(),
              type: 'info',
              title: 'Qualitätsmangel - B-Ware freigegeben',
              message: `${task.defectQty} Stk als B-Ware freigegeben - Ware kann verkauft werden`,
              orderId: task.orderId,
              product: task.product,
              lpn: task.lpn || null,
              quantity: task.defectQty,
              read: false,
              created: new Date().toLocaleString('de-DE')
            };
            setMessages(prev => [bWareMessage, ...prev]);
          }
        }
      };
      
      const pendingTasks = purchasingTasks.filter(t => 
        !t.status.includes('BACKORDER') && 
        !t.status.includes('CLOSED') && 
        !t.status.includes('ACCEPTED') &&
        !t.status.includes('RETURN') &&
        !t.status.includes('CLAIM') &&
        !t.status.includes('WRITTEN') &&
        !t.status.includes('B_WARE')
      );
      
      const resolvedTasks = purchasingTasks.filter(t => !pendingTasks.includes(t));
      
      return (
        <div className="desktop-view">
          <div className="header">
            <div className="logo">
              <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
              <span className="logo-badge">Prototype</span>
            </div>
            <div className="view-switcher">
              <button 
                className="view-btn"
                onClick={() => {
                  setCurrentView('warehouse');
                  setCurrentScreen('incoming-orders');
                }}
              >
                📱 Lager (Mobile)
              </button>
              <button 
                className="view-btn"
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button className="view-btn active">
                🛒 Einkauf (Desktop)
              </button>
            </div>
          </div>

          <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                🛒 Einkauf - Task Management
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                Verwaltung von Liefer-Abweichungen und Qualitätsmängeln
              </p>
            </div>

            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>
                    {pendingTasks.length}
                  </span>
                  Offene Tasks
                </h2>

                {pendingTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="card" 
                    style={{ 
                      marginBottom: '16px',
                      border: task.type === 'quality' ? '2px solid #ef4444' : '2px solid rgba(255, 193, 7, 0.5)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            background: task.type === 'underdelivery' ? 'rgba(239, 68, 68, 0.1)' :
                                       task.type === 'overdelivery' ? 'rgba(255, 193, 7, 0.1)' :
                                       'rgba(239, 68, 68, 0.2)',
                            color: task.type === 'underdelivery' ? '#ef4444' :
                                   task.type === 'overdelivery' ? '#d97706' :
                                   '#ef4444',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {task.type === 'underdelivery' ? '📉 Unterlieferung' :
                             task.type === 'overdelivery' ? '📈 Überlieferung' :
                             '⚠️ Qualitätsmangel'}
                          </span>
                          <span style={{ 
                            fontSize: '14px', 
                            color: 'var(--text-secondary)' 
                          }}>
                            {task.created}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                          {task.product}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Bestellung: {task.orderId}
                        </p>
                      </div>
                      <div style={{ 
                        padding: '8px 16px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#d97706'
                      }}>
                        {task.status.replace(/_/g, ' ')}
                      </div>
                    </div>

                    {task.type === 'underdelivery' && (
                      <div>
                        <div style={{ 
                          background: 'rgba(239, 68, 68, 0.05)',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Bestellt:</span>
                            <span>{formatNumberFull(task.ordered)} Stk</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Erhalten:</span>
                            <span style={{ color: '#ef4444' }}>{formatNumberFull(task.received)} Stk</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '8px',
                            marginTop: '8px'
                          }}>
                            <span style={{ fontWeight: '700' }}>Fehlmenge:</span>
                            <span style={{ fontWeight: '700', color: '#ef4444' }}>
                              {formatNumberFull(Math.abs(task.difference))} Stk
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleTaskAction(task.id, 'expect-rest')}
                            style={{ flex: 1 }}
                          >
                            ⏳ Rest erwarten (Backorder)
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleTaskAction(task.id, 'cancel-rest')}
                            style={{ 
                              flex: 1,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '2px solid #ef4444',
                              color: '#ef4444'
                            }}
                          >
                            ✗ Rest stornieren
                          </button>
                        </div>
                      </div>
                    )}

                    {task.type === 'overdelivery' && (
                      <div>
                        <div style={{ 
                          background: 'rgba(255, 193, 7, 0.05)',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Bestellt:</span>
                            <span>{formatNumberFull(task.ordered)} Stk</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Erhalten:</span>
                            <span style={{ color: '#d97706' }}>{formatNumberFull(task.received)} Stk</span>
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '8px',
                            marginTop: '8px'
                          }}>
                            <span style={{ fontWeight: '700' }}>Überhang:</span>
                            <span style={{ fontWeight: '700', color: '#d97706' }}>
                              +{formatNumberFull(task.difference)} Stk
                            </span>
                          </div>
                          <div style={{ 
                            marginTop: '12px',
                            padding: '8px',
                            background: 'rgba(0, 102, 255, 0.05)',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}>
                            <strong>Lager-Entscheidung:</strong> {
                              task.decision === 'all' ? '✅ Alles eingelagert' :
                              `📦 ${formatNumberFull(task.ordered)} Stk eingelagert, ${formatNumberFull(task.difference)} Stk auf KLÄRPLATZ`
                            }
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleTaskAction(task.id, 'keep')}
                            style={{ flex: 1 }}
                          >
                            ✓ Behalten (PO anpassen)
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleTaskAction(task.id, 'return')}
                            style={{ 
                              flex: 1,
                              background: 'rgba(255, 193, 7, 0.1)',
                              border: '2px solid #d97706',
                              color: '#d97706'
                            }}
                          >
                            ↩️ Retoure einleiten
                          </button>
                        </div>
                      </div>
                    )}

                    {task.type === 'quality' && (
                      <div>
                        <div style={{ 
                          background: 'rgba(239, 68, 68, 0.05)',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '16px'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                OK-Menge (eingelagert)
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>
                                {formatNumberFull(task.okQty)} Stk
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Defekt (SPERRLAGER)
                              </div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                                {formatNumberFull(task.defectQty)} Stk
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ 
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                              Grund:
                            </div>
                            <div style={{ fontWeight: '600', color: '#ef4444' }}>
                              {task.reason}
                            </div>
                          </div>
                          
                          {task.photo && (
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Foto vom Schaden:
                              </div>
                              <img 
                                src={task.photo} 
                                alt="Schaden" 
                                style={{ 
                                  width: '100%', 
                                  maxWidth: '300px',
                                  borderRadius: '8px',
                                  border: '2px solid var(--border-color)'
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn"
                            onClick={() => handleTaskAction(task.id, 'return')}
                            style={{ 
                              flex: 1,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '2px solid #ef4444',
                              color: '#ef4444'
                            }}
                          >
                            ↩️ Retoure/Reklamation
                          </button>
                          <button
                            className="btn"
                            onClick={() => handleTaskAction(task.id, 'write-off')}
                            style={{ 
                              flex: 1,
                              background: 'rgba(168, 172, 184, 0.1)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            🗑️ Abschreiben
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleTaskAction(task.id, 'b-ware')}
                            style={{ flex: 1 }}
                          >
                            📦 Als B-Ware freigeben
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {resolvedTasks.length > 0 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  ✓ Abgeschlossene Tasks ({resolvedTasks.length})
                </h2>

                {resolvedTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="card" 
                    style={{ 
                      marginBottom: '12px',
                      opacity: 0.6,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                          {task.product}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {task.orderId} • {task.created}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: 'var(--success)',
                          marginBottom: '4px'
                        }}>
                          ✓ {task.resolution}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {task.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {purchasingTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  Keine Tasks
                </h3>
                <p>Alle Lieferungen wurden ordnungsgemäß abgewickelt.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Header Component
    function Header({ currentView, setCurrentView, setCurrentScreen }) {
      return (
        <div className={currentView === 'warehouse' ? 'mobile-view' : 'desktop-view'}>
          <div className="header">
            <div className="logo">
              <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
              <span className="logo-badge">Prototype</span>
            </div>
            <div className="view-switcher">
              <button 
                className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('warehouse');
                  setCurrentScreen('incoming-orders');
                }}
              >
                📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Navigation Menu Component
    function NavigationMenu({ currentScreen, setCurrentScreen, receivedOrdersCount, relocationOrdersCount, pickingOrdersCount, inventoryCount, messagesCount }) {
      const menuItems = [
        { id: 'incoming-orders', icon: '📥', label: 'Incoming', count: null },
        { id: 'received-orders', icon: '✅', label: 'Received', count: receivedOrdersCount },
        { id: 'distribution', icon: '📍', label: 'Distribution', count: relocationOrdersCount },
        { id: 'inventory', icon: '📦', label: 'Inventory', count: inventoryCount },
        { id: 'picking', icon: '🎯', label: 'Picking', count: pickingOrdersCount },
        { id: 'stocktaking', icon: '📊', label: 'Stocktaking', count: null },
        { id: 'messages', icon: '💬', label: 'Messages', count: messagesCount }
      ];

      return (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          background: 'var(--background)',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '12px 8px',
                background: currentScreen === item.id ? 'var(--primary)' : 'rgba(168, 172, 184, 0.1)',
                color: currentScreen === item.id ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
              <div>{item.label}</div>
              {item.count !== null && item.count > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: currentScreen === item.id ? 'rgba(255, 255, 255, 0.3)' : 'var(--primary)',
                  color: currentScreen === item.id ? 'white' : 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  minWidth: '18px'
                }}>
                  {item.count}
                </div>
              )}
            </button>
          ))}
        </div>
      );
    }

    // Warehouse View
    function WarehouseView({ 
      currentView,
      setCurrentView,
      setCurrentScreen,
      currentScreen, 
      searchTerm,
      setSearchTerm,
      filteredDeliveries,
      selectedDelivery,
      setSelectedDelivery,
      products,
      selectedProduct,
      handleDeliveryClick,
      handleProductClick,
      quantity,
      setQuantity,
      handleQuantityConfirm,
      handleSplitDecision,
      showModal,
      setShowModal,
      modalType,
      setModalType,
      splitQtyPrimary,
      setSplitQtyPrimary,
      showLabelPreview,
      tasks,
      handleTaskComplete,
      vpeSize,
      setVpeSize,
      vpeUnits,
      setVpeUnits,
      handleQuantityDeviationDecision,
      handleNotifyOrderer,
      handleVpeSplitConfirm,
      vpeQuantities,
      setVpeQuantities,
      handleVpeQuantityChange,
      handleVpeFieldBlur,
      handleVpeFieldKeyPress,
      handleRemoveVpeField,
      selectedOverhangVPEs,
      handleOverhangSelectionToggle,
      handleOverhangSelectionConfirm,
      pdfOpened,
      setPdfOpened,
      deliveryNote,
      setDeliveryNote,
      handleBookDelivery,
      handleDeliveryNoteConfirm,
      handleFinalBooking,
      receivedOrders,
      setReceivedOrders,
      relocationOrders,
      setRelocationOrders,
      assignedVPEs,
      setAssignedVPEs,
      inventoryItems,
      setInventoryItems,
      pickingOrders,
      setPickingOrders,
      showQualitySplit,
      setShowQualitySplit,
      qualityOkQty,
      setQualityOkQty,
      qualityDefectQty,
      setQualityDefectQty,
      qualityReason,
      setQualityReason,
      qualityPhoto,
      setQualityPhoto,
      proceedToVpeSplit,
      setPurchasingTasks,
      handleOverdeliveryDecision,
      incomingDeliveries,
      setIncomingDeliveries,
      returnTasks,
      setReturnTasks,
      messages,
      setMessages,
      selectedInventoryItem,
      setSelectedInventoryItem,
      showInventoryEdit,
      setShowInventoryEdit,
      replenishmentTasks,
      setReplenishmentTasks,
      checkReplenishment,
      selectedWarehouse,
      setSelectedWarehouse,
      orderBookingStatus,
      setOrderBookingStatus,
      getOrderStatus,
      getOrderProgress,
      isPositionBooked,
      hasDeliveryNote,
      getDeliveryNote,
      orderProducts,
      getProductDetails,
      incomingWarehouseFilter,
      setIncomingWarehouseFilter,
      distributionSearch,
      setDistributionSearch,
      relocationSearch,
      setRelocationSearch,
      transferSearch,
      setTransferSearch,
      auditLog,
      setAuditLog,
      auditLogFilter,
      setAuditLogFilter,
      addAuditLogEntry,
      assignLocationModal,
      setAssignLocationModal,
      pickingSortMode,
      setPickingSortMode
    }) {
    // Calculate allDistributionItems for all screens (used in Navigation counters)
      // Filter out VPEs that have already been assigned
      const allDistributionItems = [
        ...relocationOrders.map(item => ({
          ...item,
          type: 'relocation',
          status: 'Wartet auf Lagerplatz'
        })),
        // Add VPE from received orders - use STORED vpeUnits if available!
        ...receivedOrders.flatMap(order => {
          // If order has vpeUnits stored, use those (with actual quantities)
          if (order.vpeUnits && order.vpeUnits.length > 0) {
            return order.vpeUnits.map((vpe, i) => ({
              productName: order.productName || order.supplier,
              productId: order.productId,
              productVariant: vpe.variant || order.productVariant,  // ← VPE variant first!
              lpn: vpe.lpn,
              quantity: vpe.qty,  // ← Use ACTUAL quantity from VPE!
              destination: vpe.destination,  // ← Keep destination info
              returnScheduled: vpe.returnScheduled,  // ← NEW: Return flag
              warehouse: vpe.warehouse || order.warehouse || 'HQ',  // ← Warehouse from VPE or order
              vpeNumber: vpe.id,
              orderId: order.orderId,
              supplier: order.supplier,
              type: 'new',
              status: 'Neu - Zuordnung erforderlich'
            }));
          } else {
            // Fallback for old orders without vpeUnits (backwards compatibility)
            return Array.from({ length: order.vpeCount }, (_, i) => {
              const lpn = generateLPN(order.orderId, i + 1);
              return {
                productName: order.productName || order.supplier,
                productId: order.productId,
                productVariant: order.productVariant,  // ← VARIANT!
                lpn: lpn,
                quantity: Math.floor(order.receivedQuantity / order.vpeCount),
                warehouse: order.warehouse || 'HQ',  // ← Warehouse from order
                vpeNumber: i + 1,
                orderId: order.orderId,
                supplier: order.supplier,
                type: 'new',
                status: 'Neu - Zuordnung erforderlich'
              };
            });
          }
        }).filter(item => !assignedVPEs.includes(item.lpn)) // Filter out assigned VPEs
      ];

      if (currentScreen === 'tasks') {
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('incoming-orders')}>
              ← Zurück zum Dashboard
            </button>
            
            {replenishmentTasks.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: '24px' }}>
                  📊 Nachschub-Aufgaben
                  <span style={{ 
                    marginLeft: '12px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    background: 'rgba(255, 193, 7, 0.1)',
                    color: '#d97706',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {replenishmentTasks.filter(t => t.status === 'PENDING').length}
                  </span>
                </h2>
                
                <div className="task-list">
                  {replenishmentTasks.filter(t => t.status === 'PENDING').map(task => (
                    <div 
                      key={task.id} 
                      className="task-item"
                      style={{ borderLeft: '4px solid #d97706' }}
                    >
                      <div className="task-info">
                        <h3>📊 Nachschub: {task.productName}</h3>
                        {task.variant !== '0' && <p>Variante: {task.variant}</p>}
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '12px', 
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.6'
                        }}>
                          <div><strong>Von:</strong> {task.from} {task.fromLPN && `(${task.fromLPN})`}</div>
                          <div style={{ marginTop: '4px' }}><strong>Nach:</strong> {task.to}</div>
                          <div style={{ marginTop: '4px' }}><strong>Menge:</strong> {formatNumberFull(task.qtyNeeded)} Stk</div>
                          <div style={{ marginTop: '4px' }}><strong>Verfügbar:</strong> {formatNumberFull(task.qtyAvailable)} Stk</div>
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ color: '#d97706', fontWeight: '600' }}>
                              📦 Mindestbestand am Hauptlagerplatz unterschritten
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="task-action">
                        → Swipe zum Erledigen
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {returnTasks.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: '24px' }}>
                  ↩️ Retouren-Aufgaben
                  <span style={{ 
                    marginLeft: '12px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {returnTasks.length}
                  </span>
                </h2>
                
                <div className="task-list">
                  {returnTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="task-item urgent"
                      style={{ borderLeft: '4px solid #dc2626' }}
                    >
                      <div className="task-info">
                        <h3>↩️ Retoure vorbereiten</h3>
                        <p>{task.product}</p>
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '12px', 
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: '1.6'
                        }}>
                          <div><strong>LPN:</strong> {task.lpn}</div>
                          <div style={{ marginTop: '4px' }}><strong>Menge:</strong> {task.quantity} Stk</div>
                          <div style={{ marginTop: '4px' }}><strong>Grund:</strong> {task.reason}</div>
                          <div style={{ marginTop: '4px' }}><strong>Lieferant:</strong> {task.supplier}</div>
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ color: '#dc2626', fontWeight: '600' }}>
                              📍 LPN scannen und zur Retouren-Zone bringen
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="task-action">
                        → Swipe zum Erledigen
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <h2 className="section-title" style={{ marginTop: returnTasks.length > 0 ? '32px' : '0' }}>
              Offene Aufgaben
            </h2>
            
            <div className="task-list">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`task-item ${task.urgent ? 'urgent' : 'normal'}`}
                  onClick={() => handleTaskComplete(task.id)}
                >
                  <div className="task-info">
                    <h3>{task.title}</h3>
                    <p>{task.subtitle}</p>
                    {task.details && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        lineHeight: '1.6'
                      }}>
                        <div><strong>Produkt:</strong> {task.details.product}</div>
                        <div style={{ marginTop: '4px' }}>
                          <strong>Bestand:</strong> {task.details.currentStock} Stk 
                          <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>
                            (Min: {task.details.binMin})
                          </span>
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <strong>Nachfüllen:</strong> {task.details.targetQty} Stk
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                            (≈ {Math.ceil(task.details.targetQty / task.details.vpe)} {task.details.vpeUnit})
                          </span>
                        </div>
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                          <div>📍 Von: {task.details.fromLocation}</div>
                          <div>🎯 Nach: {task.details.toLocation}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="task-action">
                    → Swipe zum Erledigen
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (currentScreen === 'product-detail') {
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('order-detail')}>
              ← Zurück zur Bestellung
            </button>
            
            <div className="card">
              <div className="product-image" style={{ width: '100px', height: '100px', fontSize: '48px', margin: '0 auto 24px' }}>
                {selectedProduct.emoji}
              </div>
              <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{selectedProduct.name}</h2>
              {selectedProduct.supplierName && (
                <p style={{ 
                  textAlign: 'center', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  {selectedProduct.supplierName}
                </p>
              )}
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Artikel-Nr: {selectedProduct.id}
              </p>

              <div className="input-group">
                <label className="input-label">Menge eingeben</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="btn-group">
                <button className="btn btn-primary" onClick={handleQuantityConfirm}>
                  ✓ Menge bestätigen
                </button>
                <button 
                  className="btn" 
                  onClick={() => {
                    setQualityOkQty(quantity);
                    setQualityDefectQty(0);
                    setShowQualitySplit(true);
                  }}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid #ef4444',
                    color: '#ef4444'
                  }}
                >
                  ⚠️ Qualitäts-Mangel
                </button>
              </div>
            </div>

            {showQualitySplit && (
              <QualitySplitModal
                selectedProduct={selectedProduct}
                selectedDelivery={selectedDelivery}
                totalQty={quantity}
                qualityOkQty={qualityOkQty}
                setQualityOkQty={setQualityOkQty}
                qualityDefectQty={qualityDefectQty}
                setQualityDefectQty={setQualityDefectQty}
                qualityReason={qualityReason}
                setQualityReason={setQualityReason}
                qualityPhoto={qualityPhoto}
                setQualityPhoto={setQualityPhoto}
                onConfirm={() => {
                  // Create purchasing task
                  const task = {
                    id: Date.now(),
                    type: 'quality',
                    orderId: selectedDelivery.orderId,
                    product: selectedProduct.name,
                    ordered: selectedProduct.ordered,
                    okQty: qualityOkQty,
                    defectQty: qualityDefectQty,
                    reason: qualityReason,
                    photo: qualityPhoto,
                    status: 'QUALITY_PENDING',
                    created: new Date().toLocaleString('de-DE')
                  };
                  setPurchasingTasks(prev => [...prev, task]);
                  
                  // Set quantity to OK qty and proceed
                  setQuantity(qualityOkQty);
                  setShowQualitySplit(false);
                  proceedToVpeSplit();
                }}
                onClose={() => setShowQualitySplit(false)}
              />
            )}

            {showModal && modalType === 'quantity-deviation' && (
              <QuantityDeviationModal 
                selectedProduct={selectedProduct}
                orderedQty={selectedProduct.ordered}
                actualQty={quantity}
                onDecision={handleQuantityDeviationDecision}
                onClose={() => setShowModal(false)}
              />
            )}
            
            {showModal && modalType === 'overdelivery' && (
              <OverdeliveryModal 
                selectedProduct={selectedProduct}
                orderedQty={selectedProduct.ordered}
                actualQty={quantity}
                difference={quantity - selectedProduct.ordered}
                onDecision={handleOverdeliveryDecision}
                onClose={() => setShowModal(false)}
              />
            )}

            {showModal && modalType === 'notify-orderer' && (
              <NotifyOrdererModal 
                selectedProduct={selectedProduct}
                selectedDelivery={selectedDelivery}
                orderedQty={selectedProduct.ordered}
                actualQty={quantity}
                onSend={handleNotifyOrderer}
                onClose={() => setShowModal(false)}
              />
            )}

            {showModal && modalType === 'vpe-split' && selectedProduct && (
              <VpeSplitModal 
                selectedProduct={selectedProduct}
                totalQty={quantity}
                vpeQuantities={vpeQuantities}
                handleVpeQuantityChange={handleVpeQuantityChange}
                handleVpeFieldBlur={handleVpeFieldBlur}
                handleVpeFieldKeyPress={handleVpeFieldKeyPress}
                handleRemoveVpeField={handleRemoveVpeField}
                onConfirm={handleVpeSplitConfirm}
                onClose={() => setShowModal(false)}
              />
            )}

            {showModal && modalType === 'overhang-selection' && selectedProduct && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <h2 style={{ marginBottom: '16px', color: '#ef4444' }}>⚠️ Überlieferung: Überhang markieren</h2>
                  
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Bestellt:</strong> {selectedProduct.ordered.toLocaleString()} Stk
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <strong>Geliefert:</strong> {quantity.toLocaleString()} Stk
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>
                      <strong>Überhang:</strong> {(quantity - selectedProduct.ordered).toLocaleString()} Stk
                    </div>
                  </div>

                  <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Welche VPE(s) enthalten den Überhang?<br />
                    <span style={{ fontSize: '12px', fontStyle: 'italic' }}>
                      (Nichts auswählen = alles normal einlagern)
                    </span>
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    {vpeUnits.map((vpe) => {
                      const isSelected = selectedOverhangVPEs.includes(vpe.id);
                      return (
                        <div
                          key={vpe.id}
                          onClick={() => handleOverhangSelectionToggle(vpe.id)}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            background: isSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(168, 172, 184, 0.1)',
                            border: isSelected ? '2px solid #ef4444' : '2px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            border: '2px solid',
                            borderColor: isSelected ? '#ef4444' : 'var(--border)',
                            background: isSelected ? '#ef4444' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '700'
                          }}>
                            {isSelected && '✓'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>VPE {vpe.id}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                              {vpe.qty.toLocaleString()} Stk
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'rgba(0, 200, 83, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid rgba(0, 200, 83, 0.3)'
                  }}>
                    <strong>Ausgewählt:</strong> {
                      vpeUnits
                        .filter(vpe => selectedOverhangVPEs.includes(vpe.id))
                        .reduce((sum, vpe) => sum + vpe.qty, 0)
                        .toLocaleString()
                    } Stk
                    {selectedOverhangVPEs.length > 0 && 
                      vpeUnits.filter(vpe => selectedOverhangVPEs.includes(vpe.id)).reduce((sum, vpe) => sum + vpe.qty, 0) >= (quantity - selectedProduct.ordered) && 
                      ' ✓'
                    }
                  </div>

                  <div className="btn-group">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleOverhangSelectionConfirm}
                      style={{ width: '100%' }}
                    >
                      ✓ Bestätigen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showModal && modalType === 'split' && (
              <SplitModal 
                selectedProduct={selectedProduct}
                quantity={quantity}
                splitQtyPrimary={splitQtyPrimary}
                setSplitQtyPrimary={setSplitQtyPrimary}
                onConfirm={() => showLabelPreview(true)}
                onClose={() => setShowModal(false)}
              />
            )}

            {showModal && modalType === 'labels' && selectedProduct && selectedDelivery && (
              <LabelPreviewModal 
                selectedProduct={selectedProduct}
                splitQtyPrimary={splitQtyPrimary}
                totalQty={quantity}
                vpeSize={vpeSize}
                vpeUnits={vpeUnits && vpeUnits.length > 0 ? vpeUnits : [{ 
                  id: 1, 
                  qty: quantity,
                  lpn: generateLPN(selectedDelivery.orderId, 1),
                  warehouse: selectedDelivery?.warehouse || 'HQ',
                  variant: selectedProduct?.variant || null
                }]}
                orderId={selectedDelivery.orderId}
                pdfOpened={pdfOpened}
                setPdfOpened={setPdfOpened}
                onClose={() => setShowModal(false)}
                onFinish={() => {
                  setShowModal(false);
                  setCurrentScreen('incoming-orders');
                }}
                onBookDelivery={handleBookDelivery}
              />
            )}

            {showModal && modalType === 'delivery-note' && (
              <DeliveryNoteUploadModal 
                selectedDelivery={selectedDelivery}
                deliveryNote={deliveryNote}
                setDeliveryNote={setDeliveryNote}
                onConfirm={handleDeliveryNoteConfirm}
                onClose={() => setShowModal(false)}
              />
            )}

            {showModal && modalType === 'confirm-booking' && (
              <ConfirmBookingModal 
                selectedDelivery={selectedDelivery}
                deliveryNote={deliveryNote}
                quantity={quantity}
                vpeUnits={vpeUnits}
                onConfirm={handleFinalBooking}
                onClose={() => setShowModal(false)}
              />
            )}
          </div>
        );
      }

      if (currentScreen === 'order-detail') {
        console.log('═════════════════════════════════════════');
        console.log('🔍 PRODUCT LOADING DEBUG START');
        console.log('═════════════════════════════════════════');
        console.log('📋 Current screen:', currentScreen);
        console.log('📦 Selected delivery:', selectedDelivery);
        console.log('📦 Selected delivery orderId:', selectedDelivery?.orderId);
        console.log('📦 Selected delivery.products:', selectedDelivery?.products);
        
        // Extract numeric part of orderId (remove "AG " prefix)
        const orderIdKey = selectedDelivery?.orderId?.replace('AG ', '');
        console.log('📦 orderIdKey (without AG):', orderIdKey);
        console.log('📦 orderProducts[orderIdKey]:', orderIdKey ? orderProducts[orderIdKey] : 'no orderIdKey');
        
        // Calculate products HERE (before JSX)
        let currentProducts = [];
        
        if (selectedDelivery && selectedDelivery.products) {
          console.log('✅ Path A: Using selectedDelivery.products');
          console.log('   Products count:', selectedDelivery.products.length);
          currentProducts = selectedDelivery.products.map((p, idx) => {
            console.log(`   🟢 Product ${idx}:`, p);
            const details = getProductDetails(p.id, p.name, p.supplierName || selectedDelivery.supplier, p.ordered, p.pos || 1, p.variant, p.alreadyReceived, p.isBackorderProduct);
            console.log(`   🟢 Product ${idx} after getProductDetails:`, details);
            return details;
          });
        } else if (selectedDelivery && orderIdKey && orderProducts[orderIdKey]) {
          console.log('✅ Path B: Using orderProducts[orderIdKey]');
          console.log('   Products count:', orderProducts[orderIdKey].length);
          currentProducts = orderProducts[orderIdKey].map((p, idx) => {
            console.log(`   🟠 Product ${idx}:`, p);
            const details = getProductDetails(p.id, p.name, p.supplierName, p.ordered);
            console.log(`   🟠 Product ${idx} after getProductDetails:`, details);
            return details;
          });
        } else {
          console.log('❌ Path C: NO PRODUCTS FOUND');
          console.log('   selectedDelivery exists?', !!selectedDelivery);
          console.log('   selectedDelivery.products exists?', !!(selectedDelivery && selectedDelivery.products));
          console.log('   orderProducts[orderIdKey] exists?', !!(orderIdKey && orderProducts[orderIdKey]));
          currentProducts = [];
        }
        
        console.log('🎯 FINAL currentProducts:', currentProducts);
        console.log('🎯 Products length:', currentProducts.length);
        console.log('═════════════════════════════════════════');
        console.log('🔍 PRODUCT LOADING DEBUG END');
        console.log('═════════════════════════════════════════');
        
        console.log('📦 Products in order-detail:', currentProducts);
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('incoming-orders')}>
              ← Zurück zum Dashboard
            </button>
            
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>
                {selectedDelivery ? `Lieferung ${selectedDelivery.supplier}` : 'Lieferung'}
              </h2>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontSize: '15px', 
                  fontWeight: '700',
                  color: 'var(--primary)',
                  background: 'rgba(0, 102, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  {selectedDelivery ? selectedDelivery.orderId : '-'}
                </span>
              </div>
              {selectedDelivery && selectedDelivery.backorderNote && (
                <div style={{
                  fontSize: '12px',
                  color: '#d97706',
                  background: 'rgba(255, 193, 7, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  fontWeight: '600'
                }}>
                  {selectedDelivery.backorderNote}
                </div>
              )}
              {selectedDelivery && selectedDelivery.deliveryDate && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '13px' }}>
                  📅 Liefertermin: {selectedDelivery.deliveryDate}
                </p>
              )}
              {selectedDelivery && selectedDelivery.contact && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
                  Kontakt: {selectedDelivery.contact}
                </p>
              )}
              {!selectedDelivery?.contact && <div style={{ marginBottom: '16px' }}></div>}

              {/* Lieferschein Upload Button - ALWAYS VISIBLE */}
              <div style={{ marginBottom: '24px' }}>
                <button 
                  className="btn"
                  style={{
                    width: '100%',
                    background: deliveryNote ? 'rgba(0, 200, 83, 0.1)' : 'rgba(168, 172, 184, 0.1)',
                    border: deliveryNote ? '2px solid var(--success)' : '2px solid var(--border)',
                    color: deliveryNote ? 'var(--success)' : 'var(--text-primary)',
                    fontWeight: '600'
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => setDeliveryNote(e.target.result);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                >
                  {deliveryNote ? '✓ Lieferschein hochgeladen' : '📄 Lieferschein hochladen'}
                </button>
              </div>

              <div className="product-list">
                {currentProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="product-item"
                      style={{ cursor: 'default' }}
                    >
                      <div className="product-image">{product.emoji}</div>
                      <div className="product-info" style={{ flex: 1 }}>
                        <div className="product-name">
                          <span style={{
                            fontWeight: '700',
                            color: 'var(--primary)',
                            fontSize: '12px',
                            marginRight: '6px'
                          }}>
                            ID{product.id}
                          </span>
                          {' - '}
                          {product.name}
                        </div>
                        {product.supplierName && (
                          <div style={{ 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)',
                            marginTop: '2px'
                          }}>
                            {product.supplierName}
                          </div>
                        )}
                        {product.alreadyReceived !== null && product.alreadyReceived > 0 && (
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--success)',
                            background: 'rgba(0, 200, 83, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '4px',
                            marginBottom: '4px'
                          }}>
                            ✓ Bereits erhalten: {formatNumberFull(product.alreadyReceived)} Stk
                          </div>
                        )}
                        <div className="product-qty">
                          {product.alreadyReceived !== null && product.alreadyReceived > 0 ? (
                            <>
                              Noch offen: {formatNumberFull(product.ordered)} Stk
                              <span style={{ 
                                marginLeft: '6px', 
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                fontWeight: '400'
                              }}>
                                (von {formatNumberFull(product.ordered + product.alreadyReceived)} bestellt)
                              </span>
                            </>
                          ) : (
                            <>
                              {product.isBackorderProduct ? 'Noch offen:' : 'Bestellt:'} {formatNumberFull(product.ordered)} Stk
                              {product.ordered >= 1000 && (
                                <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: '600' }}>
                                  ({formatNumber(product.ordered)})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div style={{ 
                          marginTop: '6px', 
                          marginBottom: '12px',
                          display: 'flex', 
                          gap: '8px', 
                          fontSize: '11px',
                          color: 'var(--text-secondary)'
                        }}>
                          <span>🎯 {product.primaryLocation.code}</span>
                          <span>•</span>
                          <span>{product.primaryLocation.zone}</span>
                          <span>•</span>
                          <span>VPE: {product.vpe} Stk/{product.vpeUnit}</span>
                        </div>

                        {/* INLINE ACTION BUTTONS */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '8px',
                          marginTop: '12px'
                        }}>
                          <button 
                            className="btn btn-primary"
                            style={{ fontSize: '13px', padding: '8px 12px' }}
                            onClick={() => handleProductClick(product)}
                          >
                            ✓ Menge bestätigen
                          </button>
                          <button 
                            className="btn"
                            style={{ 
                              fontSize: '13px', 
                              padding: '8px 12px',
                              background: 'rgba(168, 172, 184, 0.1)',
                              border: '1px solid var(--border)'
                            }}
                            onClick={() => handleProductClick(product)}
                          >
                            📝 Menge ändern
                          </button>
                          <button 
                            className="btn"
                            style={{ 
                              fontSize: '13px', 
                              padding: '8px 12px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid #ef4444',
                              color: '#ef4444',
                              gridColumn: '1 / -1'
                            }}
                            onClick={() => {
                              // Nutze handleProductClick um States richtig zu setzen
                              handleProductClick(product);
                              // Dann öffne Quality Split Modal
                              setTimeout(() => {
                                setShowQualitySplit(true);
                              }, 100);
                            }}
                          >
                            ⚠️ Qualitätsmängel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quality Split Modal */}
            {showQualitySplit && selectedProduct && (
              <QualitySplitModal
                selectedProduct={selectedProduct}
                selectedDelivery={selectedDelivery}
                totalQty={quantity}
                qualityOkQty={qualityOkQty}
                setQualityOkQty={setQualityOkQty}
                qualityDefectQty={qualityDefectQty}
                setQualityDefectQty={setQualityDefectQty}
                qualityReason={qualityReason}
                setQualityReason={setQualityReason}
                qualityPhoto={qualityPhoto}
                setQualityPhoto={setQualityPhoto}
                onConfirm={() => {
                  // Create purchasing task
                  const task = {
                    id: Date.now(),
                    type: 'quality',
                    orderId: selectedDelivery.orderId,
                    product: selectedProduct.name,
                    ordered: selectedProduct.ordered,
                    okQty: qualityOkQty,
                    defectQty: qualityDefectQty,
                    reason: qualityReason,
                    photo: qualityPhoto,
                    status: 'QUALITY_PENDING',
                    created: new Date().toLocaleString('de-DE')
                  };
                  setPurchasingTasks(prev => [...prev, task]);
                  
                  // Set quantity to OK qty and proceed
                  setQuantity(qualityOkQty);
                  setShowQualitySplit(false);
                  proceedToVpeSplit();
                }}
                onClose={() => setShowQualitySplit(false)}
              />
            )}
          </div>
        );
      }

      // INCOMING ORDERS SCREEN
      if (currentScreen === 'incoming-orders') {
        // Filter by search AND warehouse
        const filteredByWarehouse = filteredDeliveries.filter(delivery => {
          if (incomingWarehouseFilter === 'ALL') return true;
          return (delivery.warehouse || 'HQ') === incomingWarehouseFilter;
        });
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Suche Lieferant oder AG-Nr. (z.B. 'Krück' oder '239592')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Warehouse Filter Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '16px',
                overflowX: 'auto',
                paddingBottom: '4px'
              }}>
                {[
                  { key: 'ALL', label: 'Alle', icon: '🏢' },
                  { key: 'HQ', label: 'Hauptlager', icon: '🏢' },
                  { key: 'LAGER1', label: 'Außenlager 1', icon: '🏭' },
                  { key: 'LAGER2', label: 'Außenlager 2', icon: '🏭' },
                  { key: 'LAGER3', label: 'Außenlager 3', icon: '🏭' }
                ].map(warehouse => {
                  const count = warehouse.key === 'ALL' 
                    ? filteredDeliveries.length
                    : filteredDeliveries.filter(d => (d.warehouse || 'HQ') === warehouse.key).length;
                  
                  return (
                    <button
                      key={warehouse.key}
                      onClick={() => setIncomingWarehouseFilter(warehouse.key)}
                      style={{
                        padding: '8px 12px',
                        background: incomingWarehouseFilter === warehouse.key 
                          ? 'var(--primary)' 
                          : 'rgba(168, 172, 184, 0.1)',
                        color: incomingWarehouseFilter === warehouse.key 
                          ? 'white' 
                          : 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {warehouse.icon} {warehouse.label}
                      {count > 0 && (
                        <span style={{ 
                          marginLeft: '6px',
                          fontSize: '11px',
                          opacity: incomingWarehouseFilter === warehouse.key ? 1 : 0.7
                        }}>
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  📥 Incoming Orders
                  <span style={{ 
                    marginLeft: '12px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    background: 'rgba(0, 102, 255, 0.1)',
                    color: 'var(--primary)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {filteredByWarehouse.length}
                  </span>
                </h2>
              </div>

              {filteredByWarehouse.length > 0 ? (
                <div className="delivery-list">
                  {filteredByWarehouse.map(delivery => {
                    const statusInfo = getDeliveryStatus(delivery.deliveryDate);
                    return (
                      <div 
                        key={delivery.id} 
                        className="card"
                        onClick={() => handleDeliveryClick(delivery)}
                      >
                        <div className="card-header">
                          <div>
                            <div className="card-title">{delivery.supplier}</div>
                            {delivery.contact && (
                              <div style={{ 
                                fontSize: '13px', 
                                color: 'var(--text-secondary)',
                                marginTop: '2px',
                                marginBottom: '4px'
                              }}>
                                {delivery.contact}
                              </div>
                            )}
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ 
                                fontFamily: 'JetBrains Mono, monospace', 
                                fontSize: '13px', 
                                fontWeight: '700',
                                color: 'var(--primary)',
                                background: 'rgba(0, 102, 255, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block'
                              }}>
                                {delivery.orderId}
                              </div>
                              {delivery.backorderNote && (
                                <div style={{
                                  fontSize: '11px',
                                  color: '#d97706',
                                  marginTop: '6px',
                                  fontWeight: '600'
                                }}>
                                  {delivery.backorderNote}
                                </div>
                              )}
                              {delivery.warehouse && delivery.warehouse !== 'HQ' && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#d97706',
                                  background: 'rgba(255, 193, 7, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginLeft: '6px',
                                  border: '1px solid rgba(255, 193, 7, 0.5)'
                                }}>
                                  🏭 {delivery.warehouseName || WAREHOUSES[delivery.warehouse]?.name || delivery.warehouse}
                                </div>
                              )}
                              {getOrderStatus(delivery.orderId) === 'partial' && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#0066ff',
                                  background: 'rgba(0, 102, 255, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginLeft: '6px',
                                  border: '1px solid rgba(0, 102, 255, 0.3)'
                                }}>
                                  📦 TEILLIEFERUNG ({getOrderProgress(delivery.orderId)})
                                </div>
                              )}
                              {delivery.isAdjustment && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#dc2626',
                                  background: 'rgba(220, 38, 38, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginLeft: '6px',
                                  border: '1px solid rgba(220, 38, 38, 0.3)'
                                }}>
                                  🔄 ADJUSTMENT ({delivery.adjustmentNote})
                                </div>
                              )}
                              {delivery.isBackorder && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#d97706',
                                  background: 'rgba(255, 193, 7, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginLeft: '6px',
                                  border: '1px solid rgba(255, 193, 7, 0.5)'
                                }}>
                                  🔄 BACKORDER ({delivery.backorderQty} Stk)
                                </div>
                              )}
                              {delivery.isBackorder && delivery.alreadyReceived && (
                                <div style={{
                                  fontSize: '11px',
                                  color: 'var(--success)',
                                  marginTop: '4px'
                                }}>
                                  ✓ Bereits erhalten: {delivery.alreadyReceived} Stk
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`status-badge ${statusInfo.badge}`}>
                            {statusInfo.status}
                          </span>
                        </div>
                        <div className="card-meta">
                          {delivery.deliveryDate && (
                            <>
                              <span>📅 {delivery.deliveryDate}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{delivery.items} Position{delivery.items > 1 ? 'en' : ''}</span>
                          {delivery.value && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: '600' }}>{delivery.value}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Keine offenen Lieferungen!</h3>
                  <p style={{ marginTop: '8px' }}>Alle Bestellungen wurden gebucht.</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // RECEIVED ORDERS SCREEN
      if (currentScreen === 'received-order-detail' && selectedDelivery) {
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('received-orders')}>
              ← Zurück zu Received Orders
            </button>

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                ✅ {selectedDelivery.orderId}
              </h2>

              <div style={{ 
                background: 'rgba(0, 200, 83, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(0, 200, 83, 0.3)'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Lieferant:</strong> {selectedDelivery.supplier}
                </div>
                {selectedDelivery.productName && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Artikel:</strong> {selectedDelivery.productName}
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <strong>Gebucht am:</strong> {selectedDelivery.receivedDate}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Menge:</strong> {formatNumberFull(selectedDelivery.receivedQuantity)} Stk
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>VPE erstellt:</strong> {selectedDelivery.vpeCount} Labels
                </div>
                <div>
                  <strong>Lieferschein:</strong> {selectedDelivery.hasDeliveryNote ? '✓ Hochgeladen' : '✗ Nicht vorhanden'}
                </div>
              </div>

              {selectedDelivery.hasDeliveryNote && selectedDelivery.deliveryNoteImage && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📸 Lieferschein
                  </h3>
                  <img 
                    src={selectedDelivery.deliveryNoteImage} 
                    alt="Lieferschein" 
                    style={{ 
                      maxWidth: '100%', 
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)'
                    }} 
                  />
                </div>
              )}

              {selectedDelivery.vpeUnits && selectedDelivery.vpeUnits.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📦 VPE-Übersicht ({selectedDelivery.vpeUnits.length})
                  </h3>
                  <div>
                    {selectedDelivery.vpeUnits.map((vpe, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: vpe.returnScheduled ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 200, 83, 0.1)',
                          border: vpe.returnScheduled ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(0, 200, 83, 0.3)',
                          borderRadius: '8px',
                          borderLeft: vpe.returnScheduled ? '4px solid #dc2626' : '4px solid var(--success)'
                        }}
                      >
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '600',
                          fontFamily: 'JetBrains Mono, monospace',
                          marginBottom: '6px'
                        }}>
                          {vpe.lpn}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {formatNumberFull(vpe.qty)} Stk • {vpe.destination || 'LAGERPLATZ'}
                        </div>
                        {vpe.returnScheduled && (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#dc2626',
                            marginTop: '6px'
                          }}>
                            ↩️ RETOURE - Zur Rücksendung vorbereiten
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDelivery.vpeUnits?.some(vpe => vpe.returnScheduled) && (
                <button 
                  className="btn"
                  style={{ 
                    width: '100%',
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}
                  onClick={() => {
                    if (window.confirm(`Order ${selectedDelivery.orderId} für Adjustment reopenen?\n\nDie Order wird aus "Received Orders" entfernt und kann neu gebucht werden.`)) {
                      // Remove from receivedOrders
                      setReceivedOrders(prevOrders => 
                        prevOrders.filter(o => o.orderId !== selectedDelivery.orderId)
                      );
                      
                      // Add back to incoming deliveries for re-booking
                      setIncomingDeliveries(prev => [{
                        ...selectedDelivery,
                        id: Date.now(),
                        items: 1,
                        deliveryDate: new Date().toLocaleDateString('de-DE'),
                        priority: 1,
                        isAdjustment: true,
                        adjustmentNote: 'Retoure - neu einzubuchen'
                      }, ...prev]);
                      
                      alert(`✓ Order ${selectedDelivery.orderId} wurde für Adjustment reopened!\n\nSie finden die Order jetzt in "Incoming Orders".`);
                      setCurrentScreen('incoming-orders');
                    }
                  }}
                >
                  🔄 Order für Adjustment reopenen
                </button>
              )}

              <button 
                className="btn"
                style={{ 
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  fontWeight: '600'
                }}
                onClick={() => {
                  if (window.confirm(`Buchung von ${selectedDelivery.orderId} wirklich rückgängig machen?`)) {
                    // Remove from receivedOrders using functional update
                    setReceivedOrders(prevOrders => 
                      prevOrders.filter(o => o.orderId !== selectedDelivery.orderId)
                    );
                    
                    alert(`✓ Buchung ${selectedDelivery.orderId} wurde rückgängig gemacht!`);
                    setCurrentScreen('received-orders');
                  }
                }}
              >
                🔄 Buchung rückgängig machen
              </button>
            </div>
          </div>
        );
      }

      // GROUPED RECEIVED ORDER DETAIL SCREEN
      if (currentScreen === 'grouped-received-order-detail' && selectedDelivery) {
        const handleUndoBooking = () => {
          // Remove all positions of this order from receivedOrders
          const updatedReceivedOrders = receivedOrders.filter(
            order => order.orderId !== selectedDelivery.orderId
          );
          setReceivedOrders(updatedReceivedOrders);
          
          // Find the original delivery in incomingDeliveries and reset all positions
          const updatedIncomingDeliveries = incomingDeliveries.map(delivery => {
            if (delivery.orderId === selectedDelivery.orderId) {
              // Reset all products to not booked
              return {
                ...delivery,
                products: delivery.products.map(product => ({
                  ...product,
                  booked: false,
                  bookedQuantity: 0
                }))
              };
            }
            return delivery;
          });
          setIncomingDeliveries(updatedIncomingDeliveries);
          
          // Remove from distribution items
          const updatedDistributionItems = allDistributionItems.filter(
            item => item.orderId !== selectedDelivery.orderId
          );
          setAllDistributionItems(updatedDistributionItems);
          
          // Go back to received orders list
          setCurrentScreen('received-orders');
          setSelectedDelivery(null);
        };
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('received-orders')}>
              ← Zurück
            </button>
            
            <div className="card">
              <h2 style={{ marginBottom: '8px' }}>✅ {selectedDelivery.orderId}</h2>
              {selectedDelivery.backorderReference && (
                <div style={{
                  fontSize: '13px',
                  color: '#d97706',
                  background: 'rgba(255, 193, 7, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  fontWeight: '600'
                }}>
                  {selectedDelivery.backorderNote}
                </div>
              )}
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Lieferant: {selectedDelivery.supplier}
              </p>
              <p style={{ marginBottom: '16px' }}>
                Gebucht am: {selectedDelivery.receivedDate}
              </p>
              <p style={{ marginBottom: '24px' }}>
                Lieferschein: {selectedDelivery.hasDeliveryNote ? '✓ Vorhanden' : '✗ Nicht vorhanden'}
              </p>

              <h3 style={{ marginBottom: '16px' }}>
                📦 Positionen ({selectedDelivery.positions.length})
              </h3>

              {selectedDelivery.positions.map((position, index) => (
                <div key={index} style={{
                  background: 'rgba(168, 172, 184, 0.05)',
                  border: '1px solid rgba(168, 172, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      Artikel: {position.productName}
                      {position.productVariant && (
                        <span style={{ 
                          marginLeft: '8px', 
                          color: 'var(--primary)',
                          background: 'rgba(0, 102, 255, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          {position.productVariant}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Menge: {formatNumberFull(position.receivedQuantity)} Stk
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      VPE erstellt: {position.vpeCount} Label{position.vpeCount > 1 ? 's' : ''}
                    </div>
                  </div>

                  {position.vpeUnits && position.vpeUnits.length > 0 && (
                    <div>
                      {position.vpeUnits.map((vpe, vpeIndex) => (
                        <div key={vpeIndex} style={{
                          background: 'white',
                          border: '1px solid rgba(168, 172, 184, 0.2)',
                          borderRadius: '6px',
                          padding: '12px',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '13px',
                              fontWeight: '700',
                              marginBottom: '4px'
                            }}>
                              {vpe.lpn}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {formatNumberFull(vpe.qty)} Stk
                            </div>
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            textAlign: 'right'
                          }}>
                            → Lagerplatz
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Undo Booking Button */}
              <button 
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: '24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none'
                }}
                onClick={() => {
                  if (window.confirm(
                    `Buchung rückgängig machen?\n\n` +
                    `Bestellung ${selectedDelivery.orderId} wird zurück nach "Incoming Orders" verschoben.\n\n` +
                    `Alle ${selectedDelivery.positions.length} gebuchten Position(en) werden zurückgesetzt.`
                  )) {
                    handleUndoBooking();
                  }
                }}
              >
                ↩️ Buchung rückgängig machen
              </button>
            </div>
          </div>
        );
      }

      if (currentScreen === 'received-orders') {
        // Group received orders by orderId
        const groupedOrders = receivedOrders.reduce((acc, order) => {
          if (!acc[order.orderId]) {
            acc[order.orderId] = {
              orderId: order.orderId,
              supplier: order.supplier,
              receivedDate: order.receivedDate,
              warehouse: order.warehouse,
              warehouseName: order.warehouseName,
              hasDeliveryNote: order.hasDeliveryNote,
              deliveryNoteImage: order.deliveryNoteImage,
              positions: [],
              totalQuantity: 0,
              totalVpeCount: 0,
              // Backorder tracking
              backorderReference: order.backorderReference,
              backorderCompletedId: order.backorderCompletedId,
              isBackorder: order.isBackorder,
              originalOrderId: order.originalOrderId
            };
          }
          acc[order.orderId].positions.push(order);
          acc[order.orderId].totalQuantity += order.receivedQuantity;
          acc[order.orderId].totalVpeCount += order.vpeCount;
          
          // Update backorder properties if any position has them
          if (order.backorderReference) acc[order.orderId].backorderReference = order.backorderReference;
          if (order.backorderCompletedId) acc[order.orderId].backorderCompletedId = order.backorderCompletedId;
          if (order.isBackorder) acc[order.orderId].isBackorder = order.isBackorder;
          if (order.originalOrderId) acc[order.orderId].originalOrderId = order.originalOrderId;
          
          return acc;
        }, {});
        
        // Separate PARTIAL and COMPLETE orders
        const partialOrders = [];
        const completeOrders = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        Object.values(groupedOrders).forEach(order => {
          const orderStatus = getOrderStatus(order.orderId);
          const orderDate = new Date(order.receivedDate.split('.').reverse().join('-'));
          
          if (orderStatus === 'partial') {
            partialOrders.push(order);
          } else if (orderDate >= sevenDaysAgo) {
            completeOrders.push(order);
          }
        });
        
        // Sort by date (newest first)
        partialOrders.sort((a, b) => {
          const dateA = new Date(a.receivedDate.split('.').reverse().join('-'));
          const dateB = new Date(b.receivedDate.split('.').reverse().join('-'));
          return dateB - dateA;
        });
        
        completeOrders.sort((a, b) => {
          const dateA = new Date(a.receivedDate.split('.').reverse().join('-'));
          const dateB = new Date(b.receivedDate.split('.').reverse().join('-'));
          return dateB - dateA;
        });
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                📋 Received Orders
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  background: 'rgba(0, 200, 83, 0.1)',
                  color: 'var(--success)',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {receivedOrders.length}
                </span>
              </h2>

              {/* PARTIAL SECTION */}
              {partialOrders.length > 0 && (
                <>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#0066ff',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0, 102, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 102, 255, 0.2)'
                  }}>
                    ⚠️ TEILWEISE VERBUCHT
                  </div>
                  
                  <div className="delivery-list" style={{ marginBottom: '24px' }}>
                    {partialOrders.map((groupedOrder, index) => {
                      const hasReturnVPEs = groupedOrder.positions.some(pos => 
                        pos.vpeUnits?.some(vpe => vpe.returnScheduled)
                      );
                      const orderProgress = getOrderProgress(groupedOrder.orderId);
                      
                      return (
                        <div 
                          key={index} 
                          className="card"
                          style={{ 
                            borderLeft: '4px solid #0066ff',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSelectedDelivery(groupedOrder);
                            setCurrentScreen('grouped-received-order-detail');
                          }}
                        >
                          <div className="card-header">
                            <div>
                              <div className="card-title">{groupedOrder.orderId}</div>
                              <div className="card-subtitle">{groupedOrder.supplier}</div>
                              
                              {/* Show backorder reference if exists */}
                              {groupedOrder.backorderReference && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#d97706',
                                  background: 'rgba(255, 193, 7, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  marginBottom: '4px',
                                  border: '1px solid rgba(255, 193, 7, 0.3)'
                                }}>
                                  ↗️ Backorder: {groupedOrder.backorderReference}
                                </div>
                              )}
                              
                              <div style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#0066ff',
                                background: 'rgba(0, 102, 255, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginTop: '6px',
                                border: '1px solid rgba(0, 102, 255, 0.3)'
                              }}>
                                📦 {orderProgress}
                              </div>
                            </div>
                            <span className="status-badge" style={{
                              background: 'rgba(0, 102, 255, 0.1)',
                              color: '#0066ff'
                            }}>
                              Teilweise
                            </span>
                          </div>
                          <div className="card-meta">
                            <span>📅 {groupedOrder.receivedDate}</span>
                            <span>•</span>
                            <span>{groupedOrder.positions.length} Position{groupedOrder.positions.length > 1 ? 'en' : ''}</span>
                            {groupedOrder.warehouse && (
                              <>
                                <span>•</span>
                                <span style={{ 
                                  fontWeight: '600',
                                  color: groupedOrder.warehouse !== 'HQ' ? '#d97706' : 'var(--text-primary)'
                                }}>
                                  {groupedOrder.warehouse !== 'HQ' ? '🏭' : '🏢'} {groupedOrder.warehouseName || WAREHOUSES[groupedOrder.warehouse]?.name || groupedOrder.warehouse}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{groupedOrder.totalVpeCount} VPE</span>
                            {groupedOrder.hasDeliveryNote && (
                              <>
                                <span>•</span>
                                <span>📸</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* DIVIDER */}
              {partialOrders.length > 0 && completeOrders.length > 0 && (
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, var(--border), transparent)',
                  margin: '24px 0'
                }} />
              )}

              {/* COMPLETE SECTION */}
              {completeOrders.length > 0 && (
                <>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'var(--success)',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(0, 200, 83, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 200, 83, 0.2)'
                  }}>
                    ✅ VOLLSTÄNDIG VERBUCHT (Letzte 7 Tage)
                  </div>
                  
                  <div className="delivery-list">
                    {completeOrders.map((groupedOrder, index) => {
                      const hasReturnVPEs = groupedOrder.positions.some(pos => 
                        pos.vpeUnits?.some(vpe => vpe.returnScheduled)
                      );
                      
                      return (
                        <div 
                          key={index} 
                          className="card"
                          style={{ 
                            borderLeft: hasReturnVPEs ? '4px solid #dc2626' : '4px solid var(--success)',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setSelectedDelivery(groupedOrder);
                            setCurrentScreen('grouped-received-order-detail');
                          }}
                        >
                          <div className="card-header">
                            <div>
                              <div className="card-title">{groupedOrder.orderId}</div>
                              <div className="card-subtitle">{groupedOrder.supplier}</div>
                              
                              {/* Show backorder reference if this is the original order */}
                              {groupedOrder.backorderCompletedId && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#d97706',
                                  background: 'rgba(255, 193, 7, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  border: '1px solid rgba(255, 193, 7, 0.3)'
                                }}>
                                  ↗️ Nachlieferung: {groupedOrder.backorderCompletedId}
                                </div>
                              )}
                              
                              {/* Show original reference if this is the backorder */}
                              {groupedOrder.isBackorder && groupedOrder.originalOrderId && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#d97706',
                                  background: 'rgba(255, 193, 7, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  border: '1px solid rgba(255, 193, 7, 0.3)'
                                }}>
                                  ↩️ Original: {groupedOrder.originalOrderId}
                                </div>
                              )}
                              
                              {hasReturnVPEs && (
                                <div style={{
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  color: '#dc2626',
                                  background: 'rgba(220, 38, 38, 0.1)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  border: '1px solid rgba(220, 38, 38, 0.3)'
                                }}>
                                  ↩️ RETOURE - Zur Rücksendung vorbereiten
                                </div>
                              )}
                            </div>
                            <span className={`status-badge ${hasReturnVPEs ? '' : 'success'}`} style={{
                              background: hasReturnVPEs ? 'rgba(220, 38, 38, 0.1)' : undefined,
                              color: hasReturnVPEs ? '#dc2626' : undefined
                            }}>
                              {hasReturnVPEs ? '↩️ Retoure' : '✓ Gebucht'}
                            </span>
                          </div>
                          <div className="card-meta">
                            <span>📅 {groupedOrder.receivedDate}</span>
                            <span>•</span>
                            <span>{groupedOrder.positions.length} Position{groupedOrder.positions.length > 1 ? 'en' : ''}</span>
                            {groupedOrder.warehouse && (
                              <>
                                <span>•</span>
                                <span style={{ 
                                  fontWeight: '600',
                                  color: groupedOrder.warehouse !== 'HQ' ? '#d97706' : 'var(--text-primary)'
                                }}>
                                  {groupedOrder.warehouse !== 'HQ' ? '🏭' : '🏢'} {groupedOrder.warehouseName || WAREHOUSES[groupedOrder.warehouse]?.name || groupedOrder.warehouse}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>{groupedOrder.totalVpeCount} VPE</span>
                            {groupedOrder.hasDeliveryNote && (
                              <>
                                <span>•</span>
                                <span>📸</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* EMPTY STATE */}
              {partialOrders.length === 0 && completeOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Keine gebuchten Lieferungen</h3>
                  <p style={{ marginTop: '8px' }}>Gebuchte Bestellungen werden hier angezeigt.</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // RECEIVED ORDER DETAIL SCREEN

      // DISTRIBUTION SCREEN
      if (currentScreen === 'distribution') {
        // Filter by search
        const filteredItems = allDistributionItems.filter(item => {
          const searchLower = distributionSearch.toLowerCase();
          return (
            item.lpn.toLowerCase().includes(searchLower) ||
            item.orderId.toLowerCase().includes(searchLower) ||
            item.orderId.replace('AG ', '').includes(searchLower) ||
            item.supplier.toLowerCase().includes(searchLower) ||
            item.productName.toLowerCase().includes(searchLower)
          );
        });
        
        // Handle Nachschub (Reserve → Primary) - Prompt for LPN
        const handleNachschub = () => {
          const lpn = prompt('LPN für Nachschub eingeben oder scannen:');
          if (!lpn) return;
          
          // Find item in distribution first
          let item = allDistributionItems.find(i => i.lpn.toLowerCase() === lpn.toLowerCase());
          
          // If not in distribution, check inventory directly
          const currentLocation = inventoryItems.find(inv => inv.lpn.toLowerCase() === lpn.toLowerCase());
          
          if (!currentLocation) {
            alert(`⚠️ LPN "${lpn}" nicht gefunden.`);
            return;
          }
          
          // If not in distribution items, create item from inventory
          if (!item) {
            item = {
              lpn: currentLocation.lpn,
              productName: currentLocation.productName,
              productId: currentLocation.id,
              productVariant: currentLocation.variant,
              qty: currentLocation.onStock,
              destination: currentLocation.storage, // Current location as destination
              warehouse: currentLocation.warehouse
            };
          }
          
          // Check if already on primary location
          if (currentLocation.isPrimary) {
            alert(`⚠️ Fehler: LPN "${lpn}" befindet sich bereits auf Primär-Lagerplatz ${currentLocation.storage}.\n\nNachschub ist nur von Reserve → Primär möglich.`);
            return;
          }
          
          // Find the primary location for this product
          const primaryLocation = inventoryItems.find(inv => 
            inv.id === currentLocation.id && 
            inv.variant === currentLocation.variant && 
            inv.isPrimary
          );
          
          const targetLocation = primaryLocation?.storage || item.destination;
          
          // Build confirmation message
          const confirmMsg = `📦 NACHSCHUB DURCHFÜHREN\n\n` +
            `LPN: ${item.lpn}\n` +
            `Artikel: ${item.productName}\n` +
            `Von: ${currentLocation.storage} (Reserve)\n` +
            `Nach: ${targetLocation} (Primär)\n` +
            `Menge: ${currentLocation.onStock} Stk\n\n` +
            `Nachschub jetzt durchführen?`;
          
          if (!confirm(confirmMsg)) return;
          
          // Perform nachschub - update inventory location
          setInventoryItems(prev => prev.map(inv => {
            if (inv.lpn.toLowerCase() === lpn.toLowerCase()) {
              return {
                ...inv,
                storage: targetLocation,
                isPrimary: true
              };
            }
            return inv;
          }));
          
          // Add audit log entry
          addAuditLogEntry({
            action: 'REPLENISH',
            lpn: lpn,
            articleId: item.productId,
            articleName: item.productName,
            fromLocation: currentLocation.storage,
            toLocation: targetLocation,
            quantity: currentLocation.onStock,
            reason: 'Nachschub auf Hauptlagerplatz'
          });
          
          // Mark replenishment task as complete if exists
          setReplenishmentTasks(prev => prev.map(task => {
            if (task.productId === item.productId && task.status === 'PENDING') {
              return { ...task, status: 'COMPLETED', completedAt: new Date().toISOString() };
            }
            return task;
          }));
          
          alert(`✅ Nachschub erfolgreich!\n\nLPN ${lpn} auf Primär-Lagerplatz ${targetLocation} verschoben.`);
        };
        
        // Handle Label Printing - Prompt for LPN
        const handlePrintLabel = () => {
          const lpnInput = prompt('LPN(s) für Label-Druck eingeben (mehrere mit Komma trennen):');
          if (!lpnInput) return;
          
          const lpns = lpnInput.split(',').map(l => l.trim()).filter(l => l);
          if (lpns.length === 0) return;
          
          // Get items with current data - search in distribution first, then inventory
          const labelsData = lpns.map(lpn => {
            // Try to find in distribution
            let item = allDistributionItems.find(i => i.lpn.toLowerCase() === lpn.toLowerCase());
            
            // Get current inventory data
            const currentInventory = inventoryItems.find(inv => inv.lpn.toLowerCase() === lpn.toLowerCase());
            
            if (!currentInventory) {
              console.warn(`LPN ${lpn} not found in inventory`);
              return null;
            }
            
            // If not in distribution, create from inventory
            if (!item) {
              item = {
                lpn: currentInventory.lpn,
                productName: currentInventory.productName,
                productId: currentInventory.id,
                productVariant: currentInventory.variant,
                qty: currentInventory.onStock,
                orderId: 'NACHSCHUB',
                supplier: currentInventory.supplier || 'Lager'
              };
            }
            
            return {
              lpn: item.lpn,
              productName: item.productName,
              productId: item.productId,
              variant: item.productVariant,
              quantity: currentInventory.onStock,
              location: currentInventory.storage,
              orderId: item.orderId,
              supplier: item.supplier
            };
          }).filter(l => l !== null);
          
          if (labelsData.length === 0) {
            alert('⚠️ Keine gültigen LPNs gefunden.');
            return;
          }
          
          // Generate PDF with all labels (SAME FORMAT as incoming labels!)
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [100, 150] // 10x15cm
          });
          
          const today = new Date().toLocaleDateString('de-DE');

          labelsData.forEach((label, index) => {
            if (index > 0) doc.addPage();
            
            // Header
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(label.orderId, 10, 10);
            doc.text(today, 130, 10);
            
            // Product Name
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            const productName = label.productName;
            if (productName.length > 30) {
              doc.text(productName.substring(0, 30), 10, 25);
              doc.text(productName.substring(30, 60), 10, 32);
            } else {
              doc.text(productName, 10, 25);
            }
            
            // Variant (if present)
            if (label.variant && label.variant !== '0') {
              doc.setFontSize(12);
              doc.setTextColor(0, 102, 255);
              doc.setFont(undefined, 'bold');
              doc.text(label.variant, 10, productName.length > 30 ? 38 : 32);
            }
            
            // Quantity - LARGE, right-aligned
            doc.setFontSize(48);
            doc.setTextColor(0, 102, 255);
            doc.text(`${label.quantity} Stk`, 140, 55, { align: 'right' });
            
            // Product ID
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont(undefined, 'normal');
            doc.text(`Art-Nr: ${label.productId}`, 10, 45);
            
            // LPN - License Plate Number
            doc.setFontSize(14);
            doc.setTextColor(0, 102, 255);
            doc.setFont(undefined, 'bold');
            doc.text(label.lpn, 10, 52);
            
            // QR Code (generate inline)
            try {
              const qrData = `LPN:${label.lpn}|ART:${label.productId}|QTY:${label.quantity}|LOC:${label.location}`;
              const qr = window.qrcodegen.QrCode.encodeText(qrData, window.qrcodegen.QrCode.Ecc.MEDIUM);
              const svg = qr.toSvgString(2);
              doc.addImage(`data:image/svg+xml;base64,${btoa(svg)}`, 'SVG', 10, 55, 30, 30);
            } catch (e) {
              console.error('QR generation failed:', e);
            }
            
            // Current Location
            doc.setFontSize(16);
            doc.setTextColor(0, 102, 255);
            doc.setFont(undefined, 'bold');
            doc.text(`ZIEL: ${label.location}`, 140, 65, { align: 'right' });
            
            // Barcode (generate inline using JsBarcode)
            try {
              // Create temporary canvas for barcode
              const canvas = document.createElement('canvas');
              window.JsBarcode(canvas, label.lpn, {
                format: 'CODE128',
                width: 2,
                height: 40,
                displayValue: false
              });
              const barcodeDataUrl = canvas.toDataURL('image/png');
              doc.addImage(barcodeDataUrl, 'PNG', 50, 75, 90, 20);
            } catch (e) {
              console.error('Barcode generation failed:', e);
            }
          });
          
          // Download PDF
          doc.save(`Labels_${labelsData.length}_LPNs_${new Date().toISOString().split('T')[0]}.pdf`);
          
          alert(`✅ ${labelsData.length} Label(s) generiert!\n\nPDF wird heruntergeladen...`);
        };

        // Handle 3-Wege-Zuweisung (Sandro) - Lagerplatz zuweisen mit Hauptplatz/Normalplatz-Auswahl
        const handleAssignLocation = (item) => {
          const location = prompt('Lagerplatz scannen oder eingeben:');
          if (!location || location.trim() === '') return;
          // Öffne Modal für Platz-Typ-Auswahl
          setAssignLocationModal({ item, location: location.trim() });
        };

        // Wird vom Modal aufgerufen wenn User einen Typ wählt
        const handleAssignLocationConfirm = (item, location, isPrimary) => {
          setAssignLocationModal(null);
          const articleId = item.productId || item.orderId.replace('AG ', '');

          // Bestehenden Hauptplatz demoten falls nötig
          if (isPrimary) {
            const existingPrimary = inventoryItems.find(
              inv => inv.id === articleId && inv.isPrimary
            );
            if (existingPrimary) {
              setInventoryItems(prev => prev.map(inv =>
                inv.lpn === existingPrimary.lpn && inv.storage === existingPrimary.storage
                  ? { ...inv, isPrimary: false }
                  : inv
              ));
            }
          }

          // Menge aufaddieren falls Artikel+Platz schon existiert
          const existingItem = inventoryItems.find(inv =>
            inv.id === articleId &&
            inv.variant === (item.productVariant || '0') &&
            inv.storage === location &&
            inv.warehouse === (item.warehouse || 'HQ')
          );

          if (existingItem) {
            setInventoryItems(prev => prev.map(inv => {
              if (
                inv.id === articleId &&
                inv.variant === (item.productVariant || '0') &&
                inv.storage === location &&
                inv.warehouse === (item.warehouse || 'HQ')
              ) {
                return { ...inv, onStock: inv.onStock + item.quantity, lpn: inv.lpn || item.lpn };
              }
              return inv;
            }));
          } else {
            const newInventoryItem = {
              type: 'BuyingPart',
              id: articleId,
              productName: item.productName,
              variant: item.productVariant || '0',
              supplier: item.supplier || '',
              storage: location,
              onStock: item.quantity,
              lpn: item.lpn,
              isPrimary: isPrimary,
              blocked: item.destination === 'KLÄRPLATZ',
              blockedReason: item.destination === 'KLÄRPLATZ' ? 'ÜBERLIEFERUNG - Einkauf prüft' : null,
              warehouse: item.warehouse || 'HQ'
            };
            setInventoryItems(prev => [...prev, newInventoryItem]);
          }

          if (item.type === 'relocation') {
            setRelocationOrders(prev => prev.filter(o => o.lpn !== item.lpn));
          }
          if (item.type === 'new') {
            setAssignedVPEs(prev => [...prev, item.lpn]);
          }

          addAuditLogEntry({
            action: 'ASSIGN',
            lpn: item.lpn,
            articleId: articleId,
            articleName: item.productName,
            fromLocation: 'Distribution',
            toLocation: location,
            quantity: item.quantity,
            reason: isPrimary ? 'Hauptlagerplatz zugewiesen' : 'Normaler Lagerplatz zugewiesen'
          });

          const typeLabel = isPrimary ? 'HAUPTPLATZ' : 'Platz';
          alert(`✓ Als ${typeLabel} gespeichert: ${item.lpn} → ${location}`);
        };


        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                📍 Distribution - Lagerplatz zuweisen
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  background: 'rgba(255, 160, 0, 0.1)',
                  color: 'var(--warning)',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {allDistributionItems.length}
                </span>
                <button
                  onClick={() => setCurrentScreen('audit-trail')}
                  style={{
                    marginLeft: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: 'rgba(168, 172, 184, 0.1)',
                    color: 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  📋 Historie anzeigen
                </button>
              </h2>

              {/* Search Field */}
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Suche LPN, Order-Nr oder Lieferant..."
                  value={distributionSearch}
                  onChange={(e) => setDistributionSearch(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px', 
                marginBottom: '12px'
              }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => alert('LPN Scanner öffnen...')}
                >
                  📷 LPN scannen
                </button>
                <button 
                  className="btn"
                  style={{ 
                    background: 'rgba(168, 172, 184, 0.2)'
                  }}
                  onClick={() => setCurrentScreen('relocation-search')}
                >
                  🔄 Umlagern
                </button>
              </div>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px', 
                marginBottom: '20px'
              }}>
                <button 
                  className="btn"
                  style={{ 
                    background: 'rgba(0, 200, 83, 0.1)',
                    color: 'var(--success)',
                    fontWeight: '600'
                  }}
                  onClick={handleNachschub}
                >
                  ⬆️ Auf Hauptlagerplatz
                </button>
                <button 
                  className="btn"
                  style={{ 
                    background: 'rgba(0, 102, 255, 0.1)',
                    color: 'var(--primary)',
                    fontWeight: '600'
                  }}
                  onClick={handlePrintLabel}
                >
                  🏷️ Label drucken
                </button>
                <button 
                  className="btn"
                  style={{ 
                    background: 'rgba(217, 119, 6, 0.1)',
                    color: '#d97706',
                    fontWeight: '600'
                  }}
                  onClick={() => setCurrentScreen('warehouse-transfer')}
                >
                  🏭 Zwischen Lagern
                </button>
              </div>

              {filteredItems.length > 0 ? (
                <div className="delivery-list">
                  {filteredItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="card"
                      style={{ 
                        borderLeft: item.returnScheduled
                          ? '4px solid #dc2626'
                          : item.destination === 'KLÄRPLATZ'
                            ? '4px solid #ef4444'
                            : item.type === 'new' 
                              ? '4px solid var(--success)' 
                              : '4px solid var(--warning)'
                      }}
                    >
                      <div className="card-header">
                        <div>
                          <div className="card-title">
                            {item.productId && (
                              <span style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-secondary)',
                                marginRight: '8px'
                              }}>
                                ID {item.productId} -
                              </span>
                            )}
                            {item.productName}
                            {item.productVariant && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '12px',
                                fontWeight: '700',
                                color: 'var(--primary)',
                                background: 'rgba(0, 102, 255, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                {item.productVariant}
                              </span>
                            )}
                          </div>
                          <div style={{ 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)',
                            marginTop: '4px'
                          }}>
                            {item.orderId} - {item.supplier}
                          </div>
                          <div style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontSize: '13px', 
                            fontWeight: '700',
                            color: 'var(--primary)',
                            background: 'rgba(0, 102, 255, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '6px'
                          }}>
                            {item.lpn}
                          </div>
                          {item.destination === 'KLÄRPLATZ' && !item.returnScheduled && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '6px',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                              ⚠️ ÜBERLIEFERUNG - Einkauf muss prüfen
                            </div>
                          )}
                          {item.returnScheduled && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#dc2626',
                              background: 'rgba(220, 38, 38, 0.15)',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '6px',
                              border: '1px solid rgba(220, 38, 38, 0.4)'
                            }}>
                              ↩️ RETOURE - Zur Rücksendung vorbereiten
                            </div>
                          )}
                        </div>
                        <span 
                          className="status-badge" 
                          style={{ 
                            background: item.returnScheduled
                              ? 'rgba(220, 38, 38, 0.15)'
                              : item.destination === 'KLÄRPLATZ'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : item.type === 'new' 
                                  ? 'rgba(0, 200, 83, 0.1)' 
                                  : 'rgba(255, 160, 0, 0.1)', 
                            color: item.returnScheduled
                              ? '#dc2626'
                              : item.destination === 'KLÄRPLATZ'
                                ? '#ef4444'
                                : item.type === 'new' 
                                  ? 'var(--success)' 
                                  : 'var(--warning)',
                            fontSize: '11px'
                          }}
                        >
                          {item.returnScheduled ? '↩️ Retoure' : item.destination === 'KLÄRPLATZ' ? '⚠️ Zu prüfen' : item.type === 'new' ? '🆕 Neu' : '⏳ Wartet'}
                        </span>
                      </div>
                      <div className="card-meta">
                        <span>📦 {item.quantity} Stk</span>
                        <span>•</span>
                        <span>VPE {item.vpeNumber}</span>
                        {item.warehouse && item.warehouse !== 'HQ' && (
                          <>
                            <span>•</span>
                            <span style={{ 
                              fontWeight: '600',
                              color: '#d97706'
                            }}>
                              🏭 {WAREHOUSES[item.warehouse]?.name || item.warehouse}
                            </span>
                          </>
                        )}
                      </div>
                      <button 
                        className="btn btn-primary"
                        style={{ marginTop: '12px', width: '100%' }}
                        onClick={() => handleAssignLocation(item)}
                      >
                        📍 Lagerplatz zuweisen
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                    {distributionSearch ? '🔍' : '✅'}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>
                    {distributionSearch ? 'Keine Ergebnisse' : 'Alle VPE verteilt!'}
                  </h3>
                  <p style={{ marginTop: '8px' }}>
                    {distributionSearch 
                      ? `Keine Übereinstimmung für "${distributionSearch}"` 
                      : 'Keine offenen Verteilaufgaben.'}
                  </p>
                </div>
              )}
            </div>

            {/* ── 3-Wege-Zuweisung Modal ── */}
            {assignLocationModal && (
              <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '16px'
              }}>
                <div style={{
                  background: 'white', borderRadius: '16px',
                  padding: '28px 24px', width: '100%', maxWidth: '360px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
                    📍 Lagerplatz zuweisen
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    <strong style={{ color: '#000', fontFamily: 'JetBrains Mono, monospace' }}>
                      {assignLocationModal.location}
                    </strong>
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    {assignLocationModal.item.productName}
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Was für ein Platz ist das?
                  </p>
                  <button
                    style={{
                      width: '100%', padding: '14px', marginBottom: '10px',
                      background: 'var(--primary)', color: 'white',
                      border: 'none', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                    }}
                    onClick={() => handleAssignLocationConfirm(assignLocationModal.item, assignLocationModal.location, true)}
                  >
                    ⭐ HAUPTPLATZ
                  </button>
                  <button
                    style={{
                      width: '100%', padding: '14px', marginBottom: '10px',
                      background: '#f1f5f9', color: '#1e293b',
                      border: '2px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                    }}
                    onClick={() => handleAssignLocationConfirm(assignLocationModal.item, assignLocationModal.location, false)}
                  >
                    📦 NORMALER PLATZ
                  </button>
                  <button
                    style={{
                      width: '100%', padding: '12px',
                      background: 'transparent', color: 'var(--text-secondary)',
                      border: '1px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '14px', cursor: 'pointer'
                    }}
                    onClick={() => setAssignLocationModal(null)}
                  >
                    ✗ Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      }

      // AUDIT TRAIL SCREEN
      if (currentScreen === 'audit-trail') {
        // Filter audit log entries
        const filteredAuditLog = auditLog.filter(entry => {
          let matches = true;
          
          if (auditLogFilter.location && !entry.fromLocation?.toLowerCase().includes(auditLogFilter.location.toLowerCase()) && !entry.toLocation?.toLowerCase().includes(auditLogFilter.location.toLowerCase())) {
            matches = false;
          }
          
          if (auditLogFilter.articleId && !entry.articleId?.toString().toLowerCase().includes(auditLogFilter.articleId.toLowerCase()) && !entry.articleName?.toLowerCase().includes(auditLogFilter.articleId.toLowerCase())) {
            matches = false;
          }
          
          if (auditLogFilter.lpn && !entry.lpn?.toLowerCase().includes(auditLogFilter.lpn.toLowerCase())) {
            matches = false;
          }
          
          if (auditLogFilter.action !== 'ALL' && entry.action !== auditLogFilter.action) {
            matches = false;
          }
          
          return matches;
        });
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              {/* Header with Back Button */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <button 
                  onClick={() => setCurrentScreen('distribution')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '8px',
                    marginRight: '8px'
                  }}
                >
                  ←
                </button>
                <h2 className="section-title" style={{ marginBottom: '0' }}>
                  📋 Audit Trail - Bewegungshistorie
                  <span style={{ 
                    marginLeft: '12px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    background: 'rgba(0, 102, 255, 0.1)',
                    color: 'var(--primary)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {filteredAuditLog.length}
                  </span>
                </h2>
              </div>

              {/* Filters */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: 'var(--text-secondary)',
                  marginBottom: '12px' 
                }}>
                  FILTER
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="LPN..."
                    value={auditLogFilter.lpn}
                    onChange={(e) => setAuditLogFilter({...auditLogFilter, lpn: e.target.value})}
                    style={{ fontSize: '13px', padding: '10px' }}
                  />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Lagerplatz..."
                    value={auditLogFilter.location}
                    onChange={(e) => setAuditLogFilter({...auditLogFilter, location: e.target.value})}
                    style={{ fontSize: '13px', padding: '10px' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Artikel-ID oder Name..."
                    value={auditLogFilter.articleId}
                    onChange={(e) => setAuditLogFilter({...auditLogFilter, articleId: e.target.value})}
                    style={{ fontSize: '13px', padding: '10px' }}
                  />
                  <select
                    className="search-input"
                    value={auditLogFilter.action}
                    onChange={(e) => setAuditLogFilter({...auditLogFilter, action: e.target.value})}
                    style={{ fontSize: '13px', padding: '10px' }}
                  >
                    <option value="ALL">Alle Aktionen</option>
                    <option value="BOOK">BOOK - Wareneingang</option>
                    <option value="MOVE">MOVE - Umlagerung</option>
                    <option value="REPLENISH">REPLENISH - Nachschub</option>
                    <option value="ASSIGN">ASSIGN - Lagerplatzzuweisung</option>
                    <option value="PICK">PICK - Kommissionierung</option>
                    <option value="TRANSFER">TRANSFER - Lagerwechsel</option>
                    <option value="REMOVE">REMOVE - Entfernung</option>
                  </select>
                </div>
                
                {(auditLogFilter.lpn || auditLogFilter.location || auditLogFilter.articleId || auditLogFilter.action !== 'ALL') && (
                  <button
                    onClick={() => setAuditLogFilter({ location: '', articleId: '', action: 'ALL', lpn: '' })}
                    style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--primary)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </div>

              {/* Audit Log List */}
              {filteredAuditLog.length > 0 ? (
                <div className="delivery-list">
                  {filteredAuditLog.map((entry, index) => {
                    const actionColors = {
                      BOOK: { bg: 'rgba(0, 200, 83, 0.1)', color: 'var(--success)', icon: '📦' },
                      MOVE: { bg: 'rgba(0, 102, 255, 0.1)', color: 'var(--primary)', icon: '🔄' },
                      REPLENISH: { bg: 'rgba(0, 200, 83, 0.1)', color: 'var(--success)', icon: '⬆️' },
                      ASSIGN: { bg: 'rgba(255, 160, 0, 0.1)', color: 'var(--warning)', icon: '📍' },
                      PICK: { bg: 'rgba(147, 51, 234, 0.1)', color: '#9333ea', icon: '📋' },
                      TRANSFER: { bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706', icon: '🏭' },
                      REMOVE: { bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', icon: '🗑️' }
                    };
                    
                    const actionStyle = actionColors[entry.action] || actionColors.MOVE;
                    
                    return (
                      <div 
                        key={entry.id} 
                        className="card"
                        style={{ 
                          borderLeft: `4px solid ${actionStyle.color}`
                        }}
                      >
                        <div className="card-header">
                          <div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: 'var(--text-secondary)',
                              marginBottom: '4px'
                            }}>
                              {new Date(entry.timestamp).toLocaleString('de-DE')}
                            </div>
                            
                            <div className="card-title" style={{ fontSize: '14px' }}>
                              {actionStyle.icon} {entry.action}
                            </div>
                            
                            <div className="card-subtitle">
                              👤 {entry.user}
                            </div>
                            
                            {entry.lpn && (
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                fontFamily: 'JetBrains Mono, monospace',
                                color: 'var(--primary)',
                                marginTop: '6px'
                              }}>
                                {entry.lpn}
                              </div>
                            )}
                          </div>
                          
                          <span 
                            className="status-badge" 
                            style={{ 
                              background: actionStyle.bg,
                              color: actionStyle.color,
                              fontSize: '11px'
                            }}
                          >
                            {entry.action}
                          </span>
                        </div>
                        
                        <div className="card-meta">
                          {entry.articleId && (
                            <>
                              <span style={{ fontWeight: '600' }}>ID {entry.articleId}</span>
                              {entry.articleName && (
                                <>
                                  <span>•</span>
                                  <span>{entry.articleName}</span>
                                </>
                              )}
                            </>
                          )}
                          
                          {entry.fromLocation && entry.toLocation && (
                            <>
                              {entry.articleId && <span>•</span>}
                              <span style={{ 
                                fontWeight: '600',
                                color: actionStyle.color 
                              }}>
                                {entry.fromLocation} → {entry.toLocation}
                              </span>
                            </>
                          )}
                          
                          {entry.quantity && (
                            <>
                              <span>•</span>
                              <span>{entry.quantity} Stk</span>
                            </>
                          )}
                        </div>
                        
                        {entry.reason && (
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '8px',
                            fontStyle: 'italic'
                          }}>
                            💬 {entry.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>
                    {auditLog.length === 0 ? 'Noch keine Einträge' : 'Keine Einträge gefunden'}
                  </h3>
                  <p style={{ marginTop: '8px' }}>
                    {auditLog.length === 0 
                      ? 'Bewegungen werden hier protokolliert.' 
                      : 'Versuchen Sie einen anderen Filter.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // RELOCATION SEARCH SCREEN - For relocating already assigned LPNs
      if (currentScreen === 'relocation-search') {
        const filteredInventoryForRelocation = inventoryItems.filter(item => {
          const searchLower = relocationSearch.toLowerCase();
          return (
            (item.lpn && item.lpn.toLowerCase().includes(searchLower)) ||
            item.storage.toLowerCase().includes(searchLower) ||
            (item.id && item.id.toLowerCase().includes(searchLower)) ||
            (item.supplier && item.supplier.toLowerCase().includes(searchLower)) ||
            item.productName.toLowerCase().includes(searchLower)
          );
        });

        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('distribution')}>
              ← Zurück zu Distribution
            </button>

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                🔄 Umlagern - Inventory durchsuchen
              </h2>

              {/* Search Field */}
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Artikel-ID, Produktname, LPN, Lagerplatz suchen..."
                  value={relocationSearch}
                  onChange={(e) => setRelocationSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ 
                background: 'rgba(0, 102, 255, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: 'var(--primary)'
              }}>
                💡 Durchsuchen Sie Ihr komplettes Inventory um Artikel umzulagern
              </div>

              {filteredInventoryForRelocation.length > 0 ? (
                <div className="delivery-list">
                  {filteredInventoryForRelocation.map((item, index) => (
                    <div 
                      key={index} 
                      className="card"
                      style={{ borderLeft: '4px solid var(--primary)' }}
                    >
                      <div className="card-header">
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <div style={{ 
                              fontFamily: 'JetBrains Mono, monospace', 
                              fontSize: '12px', 
                              fontWeight: '700',
                              color: 'var(--text-secondary)',
                              background: 'rgba(168, 172, 184, 0.2)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              ID {item.id}
                            </div>
                            {item.isPrimary && (
                              <span style={{
                                fontSize: '10px',
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '700'
                              }}>
                                HAUPT
                              </span>
                            )}
                          </div>
                          <div className="card-title">{item.productName}</div>
                          {item.supplier && (
                            <div style={{ 
                              fontSize: '13px', 
                              color: 'var(--text-secondary)',
                              marginTop: '4px'
                            }}>
                              {item.supplier}
                            </div>
                          )}
                          <div style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontSize: '13px', 
                            fontWeight: '700',
                            color: 'var(--primary)',
                            background: 'rgba(0, 102, 255, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '6px'
                          }}>
                            {item.lpn || 'Keine LPN'}
                          </div>
                        </div>
                      </div>
                      <div className="card-meta">
                        <span>📦 {formatNumberFull(item.onStock)} Stk</span>
                        <span>•</span>
                        <span>📍 {item.storage}</span>
                        {item.variant !== '0' && (
                          <>
                            <span>•</span>
                            <span>Var: {item.variant}</span>
                          </>
                        )}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        marginTop: '12px' 
                      }}>
                        <button 
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            const newLocation = prompt(
                              `Neuer Lagerplatz für ${item.lpn || 'diesen Artikel'}\n\nAktuell: ${item.storage}\n\nNeuer Lagerplatz:`
                            );
                            if (newLocation) {
                              const oldLocation = item.storage;
                              
                              // Update location in inventory - LPN stays the same!
                              setInventoryItems(prev => prev.map(inv => 
                                inv.lpn === item.lpn && inv.storage === item.storage
                                  ? { ...inv, storage: newLocation }
                                  : inv
                              ));
                              
                              // Add audit log entry
                              addAuditLogEntry({
                                action: 'MOVE',
                                lpn: item.lpn,
                                articleId: item.id,
                                articleName: item.productName,
                                fromLocation: oldLocation,
                                toLocation: newLocation,
                                quantity: item.onStock,
                                reason: 'Manuelle Umlagerung'
                              });
                              
                              alert(`✓ ${item.lpn || item.productName} wurde von ${oldLocation} nach ${newLocation} umgelagert!`);
                              setCurrentScreen('distribution');
                            }
                          }}
                        >
                          🔄 Umlagern
                        </button>
                        <button 
                          className="btn"
                          style={{ 
                            flex: 1,
                            background: 'rgba(168, 172, 184, 0.2)'
                          }}
                          onClick={() => {
                            alert(
                              `Artikel-ID: ${item.id}\n` +
                              `Produkt: ${item.productName}\n` +
                              `LPN: ${item.lpn || 'Keine LPN'}\n` +
                              `Lagerplatz: ${item.storage}\n` +
                              `Menge: ${formatNumberFull(item.onStock)} Stk\n` +
                              `Lieferant: ${item.supplier || '-'}\n` +
                              `Hauptlagerplatz: ${item.isPrimary ? 'Ja' : 'Nein'}`
                            );
                          }}
                        >
                          ℹ️ Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                    {relocationSearch ? '🔍' : '📦'}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>
                    {relocationSearch ? 'Keine Ergebnisse' : 'Artikel im Inventory suchen'}
                  </h3>
                  <p style={{ marginTop: '8px' }}>
                    {relocationSearch 
                      ? `Keine Übereinstimmung für "${relocationSearch}"` 
                      : 'Geben Sie einen Suchbegriff ein um Artikel zu finden'}
                  </p>
                  {!relocationSearch && (
                    <div style={{ 
                      marginTop: '24px',
                      padding: '16px',
                      background: 'rgba(168, 172, 184, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        📦 Inventory: {inventoryItems.length} Artikel verfügbar
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {inventoryItems.slice(0, 3).map(item => `${item.storage} (${item.productName})`).join(', ')}
                        {inventoryItems.length > 3 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // INVENTORY SCREEN
      // INVENTORY DETAIL SCREEN
      if (currentScreen === 'inventory-detail' && selectedInventoryItem) {
        const item = selectedInventoryItem;
        const hasMinStock = item.minStockGeneral !== undefined;
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <button className="back-btn" onClick={() => {
              setSelectedInventoryItem(null);
              setCurrentScreen('inventory');
            }}>
              ← Zurück zu Inventory
            </button>

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                📦 {item.productName}
              </h2>

              {/* Basic Info */}
              <div style={{ 
                background: 'rgba(0, 102, 255, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(0, 102, 255, 0.2)'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Artikel-ID:</strong> {item.id}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Variante:</strong> {item.variant || '-'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Typ:</strong> {item.type}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Lieferant:</strong> {item.supplier || '-'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Lagerplatz:</strong> {item.storage}
                </div>
                <div>
                  <strong>Bestand:</strong> {formatNumberFull(item.onStock)} Stk
                </div>
              </div>

              {/* Dimensions per One */}
              {item.dimensionsOne && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📏 Maße pro Einzelstück
                  </h3>
                  <div style={{ 
                    background: 'rgba(168, 172, 184, 0.1)', 
                    padding: '12px', 
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div>Breite: {item.dimensionsOne.width} mm</div>
                      <div>Höhe: {item.dimensionsOne.height} mm</div>
                      <div>Tiefe: {item.dimensionsOne.depth} mm</div>
                      <div>Gewicht: {item.dimensionsOne.weight} kg</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dimensions per VPE */}
              {item.dimensionsVPE && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📦 Standard-VPE
                  </h3>
                  <div style={{ 
                    background: 'rgba(168, 172, 184, 0.1)', 
                    padding: '12px', 
                    borderRadius: '8px'
                  }}>
                    <div style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--primary)' }}>
                      Menge: {formatNumberFull(item.dimensionsVPE.qty)} Stk
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                      <div>Breite: {item.dimensionsVPE.width} mm</div>
                      <div>Höhe: {item.dimensionsVPE.height} mm</div>
                      <div>Tiefe: {item.dimensionsVPE.depth} mm</div>
                      <div>Gewicht: {item.dimensionsVPE.weight} kg</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Min Stocks */}
              {hasMinStock && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📊 Mindestbestände
                  </h3>
                  <div style={{ 
                    background: item.onStock < item.minStockMainLocation 
                      ? 'rgba(220, 38, 38, 0.1)' 
                      : 'rgba(168, 172, 184, 0.1)', 
                    padding: '12px', 
                    borderRadius: '8px',
                    border: item.onStock < item.minStockMainLocation 
                      ? '2px solid #dc2626' 
                      : 'none'
                  }}>
                    {item.onStock < item.minStockMainLocation && (
                      <div style={{ 
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'rgba(220, 38, 38, 0.2)',
                        borderRadius: '6px',
                        color: '#dc2626',
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        ⚠️ MINDESTBESTAND UNTERSCHRITTEN - Nachschub erforderlich!
                      </div>
                    )}
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Aktueller Bestand:</strong> {formatNumberFull(item.onStock)} Stk
                      {item.onStock < item.minStockMainLocation && (
                        <span style={{ color: '#dc2626', fontWeight: '700', marginLeft: '8px' }}>
                          ({formatNumberFull(item.minStockMainLocation - item.onStock)} Stk fehlen)
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Gesamt-Mindestbestand:</strong> {formatNumberFull(item.minStockGeneral)} Stk
                    </div>
                    <div>
                      <strong>Hauptlagerplatz ({item.mainLocation}):</strong> {formatNumberFull(item.minStockMainLocation)} Stk
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setShowInventoryEdit(true)}
                >
                  ✏️ Stammdaten bearbeiten
                </button>
              </div>
              
              {/* Debug Info */}
              <div style={{ 
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(168, 172, 184, 0.1)',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>🐛 Debug Info:</div>
                <div>Has minStockMainLocation: {item.minStockMainLocation ? '✅ YES' : '❌ NO'}</div>
                <div>Has mainLocation: {item.mainLocation ? '✅ YES' : '❌ NO'}</div>
                <div>Below minimum: {item.minStockMainLocation && item.onStock < item.minStockMainLocation ? '⚠️ YES' : '✅ NO'}</div>
              </div>

              {/* Edit Modal */}
              {showInventoryEdit && (
                <InventoryMasterDataEditModal 
                  item={selectedInventoryItem}
                  onSave={(formData) => {
                    // Update inventory item with new master data
                    setInventoryItems(prev => prev.map(invItem => 
                      invItem.id === selectedInventoryItem.id && 
                      invItem.productName === selectedInventoryItem.productName &&
                      invItem.variant === selectedInventoryItem.variant
                        ? {
                            ...invItem,
                            dimensionsOne: formData.dimensionsOne,
                            dimensionsVPE: formData.dimensionsVPE,
                            minStockGeneral: formData.minStockGeneral,
                            minStockMainLocation: formData.minStockMainLocation,
                            mainLocation: formData.mainLocation
                          }
                        : invItem
                    ));
                    
                    // Update selected item
                    setSelectedInventoryItem(prev => ({
                      ...prev,
                      dimensionsOne: formData.dimensionsOne,
                      dimensionsVPE: formData.dimensionsVPE,
                      minStockGeneral: formData.minStockGeneral,
                      minStockMainLocation: formData.minStockMainLocation,
                      mainLocation: formData.mainLocation
                    }));
                  }}
                  onClose={() => setShowInventoryEdit(false)}
                />
              )}
            </div>
          </div>
        );
      }

      // WAREHOUSE TRANSFER SCREEN - Transfer between warehouses
      if (currentScreen === 'warehouse-transfer') {
        const filteredInventoryForTransfer = inventoryItems.filter(item => {
          const searchLower = transferSearch.toLowerCase();
          return (
            (item.lpn && item.lpn.toLowerCase().includes(searchLower)) ||
            item.storage.toLowerCase().includes(searchLower) ||
            (item.id && item.id.toLowerCase().includes(searchLower)) ||
            item.productName.toLowerCase().includes(searchLower)
          );
        });

        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
            </div>

            <button className="back-btn" onClick={() => setCurrentScreen('distribution')}>
              ← Zurück zu Distribution
            </button>

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                🏭 Zwischen Lagern umlagern
              </h2>

              <div style={{ 
                background: 'rgba(217, 119, 6, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#d97706',
                border: '1px solid rgba(217, 119, 6, 0.3)'
              }}>
                <strong>🏭 Lager-Transfer:</strong> Ware von einem Lager in ein anderes umbuchen (z.B. Außenlager → HQ)
              </div>

              {/* Search Field */}
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="LPN, Artikel-ID, Produktname, Lagerplatz suchen..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {filteredInventoryForTransfer.length > 0 ? (
                <div className="delivery-list">
                  {filteredInventoryForTransfer.map((item, index) => (
                    <div 
                      key={index} 
                      className="card"
                      style={{ 
                        borderLeft: item.warehouse && item.warehouse !== 'HQ' 
                          ? '4px solid #d97706' 
                          : '4px solid var(--primary)'
                      }}
                    >
                      <div className="card-header">
                        <div>
                          <div style={{ marginBottom: '6px' }}>
                            {item.warehouse && item.warehouse !== 'HQ' && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#d97706',
                                background: 'rgba(217, 119, 6, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '4px',
                                border: '1px solid rgba(217, 119, 6, 0.3)'
                              }}>
                                🏭 {WAREHOUSES[item.warehouse]?.name || item.warehouse}
                              </span>
                            )}
                            {(!item.warehouse || item.warehouse === 'HQ') && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: 'var(--primary)',
                                background: 'rgba(0, 102, 255, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '4px',
                                border: '1px solid rgba(0, 102, 255, 0.3)'
                              }}>
                                🏢 Hauptlager
                              </span>
                            )}
                          </div>
                          <div className="card-title">{item.productName}</div>
                          {item.variant && item.variant !== '0' && (
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '600',
                              color: 'var(--primary)',
                              marginTop: '4px'
                            }}>
                              Variante: {item.variant}
                            </div>
                          )}
                          {item.supplier && (
                            <div style={{ 
                              fontSize: '13px', 
                              color: 'var(--text-secondary)',
                              marginTop: '4px'
                            }}>
                              {item.supplier}
                            </div>
                          )}
                          <div style={{ 
                            fontFamily: 'JetBrains Mono, monospace', 
                            fontSize: '13px', 
                            fontWeight: '700',
                            color: 'var(--primary)',
                            background: 'rgba(0, 102, 255, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '6px'
                          }}>
                            {item.lpn || 'Keine LPN'}
                          </div>
                        </div>
                      </div>
                      <div className="card-meta">
                        <span>📦 {formatNumberFull(item.onStock)} Stk</span>
                        <span>•</span>
                        <span>📍 {item.storage}</span>
                      </div>
                      <button 
                        className="btn btn-primary"
                        style={{ marginTop: '12px', width: '100%' }}
                        onClick={() => {
                          const currentWarehouse = item.warehouse || 'HQ';
                          const currentWarehouseName = WAREHOUSES[currentWarehouse]?.name || 'Hauptlager';
                          
                          // Show warehouse selection
                          const warehouseOptions = Object.entries(WAREHOUSES)
                            .filter(([key]) => key !== currentWarehouse) // Exclude current warehouse
                            .map(([key, wh]) => `${key}: ${wh.name}`)
                            .join('\n');
                          
                          const targetKey = prompt(
                            `🏭 LAGER-TRANSFER\n\n` +
                            `Aktuelle Position:\n` +
                            `Artikel: ${item.productName}\n` +
                            `Lagerplatz: ${item.storage}\n` +
                            `Menge: ${formatNumberFull(item.onStock)} Stk\n` +
                            `Von Lager: ${currentWarehouseName}\n\n` +
                            `Verfügbare Ziellager:\n${warehouseOptions}\n\n` +
                            `Bitte Lager-Code eingeben (z.B. HQ, LAGER1, LAGER2, LAGER3):`
                          );
                          
                          if (targetKey && WAREHOUSES[targetKey.toUpperCase()]) {
                            const targetWarehouseKey = targetKey.toUpperCase();
                            const targetWarehouseName = WAREHOUSES[targetWarehouseKey].name;
                            
                            if (targetWarehouseKey === currentWarehouse) {
                              alert('⚠️ Ziellager ist identisch mit aktuellem Lager!');
                              return;
                            }
                            
                            const confirm = window.confirm(
                              `🏭 LAGER-TRANSFER BESTÄTIGEN\n\n` +
                              `Artikel: ${item.productName}\n` +
                              `Lagerplatz: ${item.storage}\n` +
                              `Menge: ${formatNumberFull(item.onStock)} Stk\n\n` +
                              `Von: ${currentWarehouseName}\n` +
                              `Nach: ${targetWarehouseName}\n\n` +
                              `Transfer durchführen?`
                            );
                            
                            if (confirm) {
                              // Update inventory item warehouse
                              setInventoryItems(prev => prev.map(inv => {
                                if (inv.lpn === item.lpn && inv.storage === item.storage) {
                                  return {
                                    ...inv,
                                    warehouse: targetWarehouseKey
                                  };
                                }
                                return inv;
                              }));
                              
                              alert(`✓ Transfer erfolgreich!\n\n${item.lpn}\n${currentWarehouseName} → ${targetWarehouseName}`);
                              setCurrentScreen('distribution');
                            }
                          } else if (targetKey) {
                            alert('⚠️ Ungültiger Lager-Code!\n\nVerfügbare Codes: HQ, LAGER1, LAGER2, LAGER3');
                          }
                        }}
                      >
                        🏭 In anderes Lager transferieren
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                    {transferSearch ? '🔍' : '📦'}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>
                    {transferSearch ? 'Keine Treffer' : 'Artikel suchen'}
                  </h3>
                  <p style={{ marginTop: '8px', fontSize: '16px' }}>
                    {transferSearch ? 'Keine Artikel gefunden mit diesem Suchbegriff' : 'Bitte LPN, Artikel-ID oder Produktname eingeben'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // INVENTORY SCREEN
      if (currentScreen === 'inventory') {
        const [inventorySearch, setInventorySearch] = React.useState('');
        const [warehouseFilter, setWarehouseFilter] = React.useState('ALL'); // ALL, HQ, LAGER1, LAGER2, LAGER3
        
        // Filter inventory by search AND warehouse
        const filteredInventory = inventoryItems.filter(item => {
          const searchLower = inventorySearch.toLowerCase();
          const matchesSearch = (
            item.type.toLowerCase().includes(searchLower) ||
            item.id.toLowerCase().includes(searchLower) ||
            item.productName.toLowerCase().includes(searchLower) ||
            item.variant.toLowerCase().includes(searchLower) ||
            item.storage.toLowerCase().includes(searchLower) ||
            (item.supplier && item.supplier.toLowerCase().includes(searchLower))
          );
          
          const matchesWarehouse = warehouseFilter === 'ALL' || item.warehouse === warehouseFilter;
          
          return matchesSearch && matchesWarehouse;
        });
        
        // Group by product (ID + ProductName + Variant)
        const groupedInventory = filteredInventory.reduce((acc, item) => {
          const key = `${item.id}-${item.productName}-${item.variant}`;
          if (!acc[key]) {
            acc[key] = {
              id: item.id,
              productName: item.productName,
              variant: item.variant,
              type: item.type,
              supplier: item.supplier,
              locations: [],
              totalStock: 0,
              warehouses: new Set() // Track which warehouses this product is in
            };
          }
          acc[key].locations.push({
            storage: item.storage,
            onStock: item.onStock,
            lpn: item.lpn,
            isPrimary: item.isPrimary,
            blocked: item.blocked,
            blockedReason: item.blockedReason,
            warehouse: item.warehouse
          });
          acc[key].warehouses.add(item.warehouse);
          acc[key].totalStock += item.onStock;
          return acc;
        }, {});
        
        const inventoryGroups = Object.values(groupedInventory);
        
        // Sort locations within each group - primary first
        inventoryGroups.forEach(group => {
          group.locations.sort((a, b) => {
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return 0;
          });
        });

        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>
                📦 Inventory - Lagerbestand
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  background: 'rgba(0, 102, 255, 0.1)',
                  color: 'var(--primary)',
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {inventoryGroups.length} Artikel
                </span>
              </h2>

              {/* Search Field */}
              <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Suche ID, Produkt, Lagerplatz..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                />
              </div>

              {/* Warehouse Filter Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '16px',
                overflowX: 'auto',
                paddingBottom: '4px'
              }}>
                {[
                  { key: 'ALL', label: 'Alle', icon: '🏢' },
                  { key: 'HQ', label: 'Hauptlager', icon: '🏢' },
                  { key: 'LAGER1', label: 'Lager 1', icon: '🏭' },
                  { key: 'LAGER2', label: 'Lager 2', icon: '🏭' },
                  { key: 'LAGER3', label: 'Lager 3', icon: '🏭' }
                ].map(warehouse => {
                  const count = warehouse.key === 'ALL' 
                    ? inventoryItems.length
                    : inventoryItems.filter(item => item.warehouse === warehouse.key).length;
                  
                  return (
                    <button
                      key={warehouse.key}
                      onClick={() => setWarehouseFilter(warehouse.key)}
                      style={{
                        padding: '8px 12px',
                        background: warehouseFilter === warehouse.key 
                          ? 'var(--primary)' 
                          : 'rgba(168, 172, 184, 0.1)',
                        color: warehouseFilter === warehouse.key 
                          ? 'white' 
                          : 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {warehouse.icon} {warehouse.label}
                      {count > 0 && (
                        <span style={{ 
                          marginLeft: '6px',
                          fontSize: '11px',
                          opacity: warehouseFilter === warehouse.key ? 1 : 0.7
                        }}>
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {inventoryGroups.length > 0 ? (
                <div className="delivery-list">
                  {inventoryGroups.map((group, index) => (
                    <div 
                      key={index} 
                      className="card"
                      style={{ 
                        borderLeft: '4px solid var(--primary)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        // Find the first item from this group to use as selected item
                        const firstItem = inventoryItems.find(item => 
                          item.id === group.id && 
                          item.productName === group.productName && 
                          item.variant === group.variant
                        );
                        if (firstItem) {
                          setSelectedInventoryItem(firstItem);
                          setCurrentScreen('inventory-detail');
                        }
                      }}
                    >
                      <div className="card-header">
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <div style={{ 
                              fontFamily: 'JetBrains Mono, monospace', 
                              fontSize: '12px', 
                              fontWeight: '700',
                              color: 'var(--text-secondary)',
                              background: 'rgba(168, 172, 184, 0.2)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              ID {group.id}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: 'var(--text-secondary)',
                              background: 'rgba(168, 172, 184, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {group.type}
                            </div>
                          </div>
                          <div className="card-title">{group.productName}</div>
                          {group.variant !== '0' && (
                            <div style={{ 
                              fontSize: '13px', 
                              color: 'var(--text-secondary)',
                              marginTop: '2px'
                            }}>
                              Variante: {group.variant}
                            </div>
                          )}
                          {group.supplier && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: 'var(--text-secondary)',
                              marginTop: '4px'
                            }}>
                              {group.supplier}
                            </div>
                          )}
                        </div>
                        <div style={{ 
                          textAlign: 'right',
                          fontSize: '24px',
                          fontWeight: '700',
                          color: 'var(--primary)'
                        }}>
                          {formatNumberFull(group.totalStock)}
                        </div>
                      </div>
                      
                      {/* Storage Locations */}
                      <div style={{ 
                        marginTop: '12px',
                        padding: '12px',
                        background: 'rgba(168, 172, 184, 0.05)',
                        borderRadius: '6px'
                      }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: 'var(--text-secondary)',
                          marginBottom: '8px'
                        }}>
                          📍 Lagerorte ({group.locations.length})
                        </div>
                        {group.locations.map((loc, locIndex) => (
                          <div 
                            key={locIndex}
                            style={{ 
                              padding: '8px 0',
                              borderBottom: locIndex < group.locations.length - 1 ? '1px solid var(--border-color)' : 'none'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px'
                            }}>
                              <div style={{ 
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                {loc.storage}
                                {loc.warehouse && loc.warehouse !== 'HQ' && (
                                  <span style={{
                                    fontSize: '10px',
                                    background: '#d97706',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700'
                                  }}>
                                    🏭 {WAREHOUSES[loc.warehouse]?.name || loc.warehouse}
                                  </span>
                                )}
                                {loc.isPrimary && (
                                  <span style={{
                                    fontSize: '10px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700'
                                  }}>
                                    HAUPT
                                  </span>
                                )}
                                {loc.blocked && (
                                  <span style={{
                                    fontSize: '10px',
                                    background: '#ef4444',
                                    color: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '700'
                                  }}>
                                    🔒 GESPERRT
                                  </span>
                                )}
                              </div>
                              <div style={{ 
                                fontSize: '13px',
                                fontWeight: '600'
                              }}>
                                {formatNumberFull(loc.onStock)} Stk
                              </div>
                            </div>
                            <div style={{ 
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '11px',
                              color: 'var(--text-secondary)',
                              paddingLeft: '2px'
                            }}>
                              {loc.lpn || 'Keine LPN'}
                            </div>
                            {loc.blocked && loc.blockedReason && (
                              <div style={{ 
                                fontSize: '11px',
                                color: '#ef4444',
                                fontWeight: '600',
                                paddingLeft: '2px',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                ⚠️ {loc.blockedReason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                    {inventorySearch ? '🔍' : '📦'}
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>
                    {inventorySearch ? 'Keine Ergebnisse' : 'Kein Lagerbestand'}
                  </h3>
                  <p style={{ marginTop: '8px' }}>
                    {inventorySearch 
                      ? `Keine Übereinstimmung für "${inventorySearch}"` 
                      : 'Lagerbestand wird hier angezeigt'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // PICKING SCREEN
      if (currentScreen === 'picking') {
        // Create flat picklist sorted by dueDate (priority) then by storage location (route)
        const picklistItems = [];
        pickingOrders.forEach(order => {
          order.items.forEach(item => {
            picklistItems.push({
              ...item,
              orderId: order.orderId,
              customerName: order.customerName,
              orderStatus: order.status,
              dueDate: order.dueDate
            });
          });
        });
        
        // Sortierung: je nach gewähltem Modus
        if (pickingSortMode === 'date') {
          // Priorität (Lieferdatum) vor Lagerplatz
          picklistItems.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
            if (dateA - dateB !== 0) return dateA - dateB;
            return a.storage.localeCompare(b.storage);
          });
        } else {
          // Laufweg-Optimierung: alphabetisch nach Lagerplatz
          picklistItems.sort((a, b) => a.storage.localeCompare(b.storage));
        }
    
        
        // Count picked and unpicked items
        const totalItems = picklistItems.length;
        const pickedItems = picklistItems.filter(item => item.picked).length;
        const allPicked = totalItems > 0 && pickedItems === totalItems;
        
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={pickingOrders.filter(o => o.status !== 'handed_to_shipping').length}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 className="section-title" style={{ marginBottom: '0' }}>
                  📦 Picking - Kommissionierung
                  <span style={{ 
                    marginLeft: '12px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    background: allPicked ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 160, 0, 0.1)',
                    color: allPicked ? 'var(--success)' : 'var(--warning)',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>
                    {pickedItems}/{totalItems} gepickt
                  </span>
                </h2>
                
                {/* BUTTON: AN VERSAND ÜBERGEBEN */}
                {pickingOrders.filter(o => o.status !== 'handed_to_shipping').length > 0 && (
                  <button
                    className="btn btn-primary"
                    style={{ 
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: 'var(--success)',
                      borderColor: 'var(--success)',
                      whiteSpace: 'nowrap'
                    }}
                    onClick={() => {
                      // Count orders with picked items
                      const ordersWithPickedItems = pickingOrders.filter(o => 
                        o.status !== 'handed_to_shipping' && 
                        o.items.some(item => item.picked)
                      );
                      
                      if (ordersWithPickedItems.length === 0) {
                        alert('⚠️ Keine gepickten Artikel vorhanden!\n\nBitte picken Sie zuerst Artikel, bevor Sie diese an den Versand übergeben.');
                        return;
                      }
                      
                      const fullyPickedCount = ordersWithPickedItems.filter(o => 
                        o.items.every(item => item.picked)
                      ).length;
                      
                      const partiallyPickedCount = ordersWithPickedItems.filter(o => 
                        o.items.some(item => item.picked) && !o.items.every(item => item.picked)
                      ).length;
                      
                      let confirmMsg = `📦 AN VERSAND ÜBERGEBEN\n\n`;
                      confirmMsg += `✓ ${fullyPickedCount} vollständig gepickte Order(s)\n`;
                      if (partiallyPickedCount > 0) {
                        confirmMsg += `⚠️ ${partiallyPickedCount} teilweise gepickte Order(s)\n`;
                      }
                      confirmMsg += `\nDiese Orders werden an den Versand übergeben.\n\n`;
                      confirmMsg += `Ungepickte Orders bleiben im Picking.\n\n`;
                      confirmMsg += `Fortfahren?`;
                      
                      if (confirm(confirmMsg)) {
                        let handedOverCount = 0;
                        
                        setPickingOrders(prev => {
                          const updated = prev.map(po => {
                            // Only hand over orders that have at least one picked item
                            if (po.status !== 'handed_to_shipping' && po.items.some(item => item.picked)) {
                              handedOverCount++;
                              return { ...po, status: 'handed_to_shipping' };
                            }
                            return po;
                          });
                          
                          // Alert AFTER state update with correct count
                          setTimeout(() => {
                            alert(`✅ ${handedOverCount} Order(s) an Versand übergeben!\n\nDie Ware kann jetzt im Versand verpackt werden.`);
                          }, 100);
                          
                          return updated;
                        });
                      }
                    }}
                  >
                    📤 An Versand übergeben
                  </button>
                )}
              </div>

              {/* Sortier-Umschalter */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  onClick={() => setPickingSortMode('date')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: pickingSortMode === 'date' ? 'var(--primary)' : '#e2e8f0',
                    background: pickingSortMode === 'date' ? 'rgba(0,102,255,0.08)' : 'white',
                    color: pickingSortMode === 'date' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📅 Nach Liefertermin
                </button>
                <button
                  onClick={() => setPickingSortMode('storage')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: pickingSortMode === 'storage' ? 'var(--primary)' : '#e2e8f0',
                    background: pickingSortMode === 'storage' ? 'rgba(0,102,255,0.08)' : 'white',
                    color: pickingSortMode === 'storage' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🗺️ Nach Lagerplatz
                </button>
              </div>

              {allPicked && totalItems > 0 && (
                <div style={{ 
                  background: 'rgba(0, 200, 83, 0.1)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: 'var(--success)',
                  border: '1px solid rgba(0, 200, 83, 0.3)'
                }}>
                  <strong>✓ Alle Artikel gepickt!</strong> Weiter zur Versandliste zum Packen.
                </div>
              )}

              {picklistItems.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#000000' }}>Lagerort</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#000000' }}>Menge</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#000000' }}>Artikel-ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#000000' }}>Artikelname</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#000000' }}>📅 Liefertermin</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#000000' }}>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picklistItems.map((item, index) => (
                        <tr 
                          key={index}
                          style={{ 
                            borderBottom: '1px solid #e2e8f0',
                            background: item.picked ? 'rgba(0, 200, 83, 0.03)' : 'white',
                            opacity: item.picked ? 0.6 : 1
                          }}
                        >
                          <td style={{ 
                            padding: '12px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontWeight: '700',
                            color: 'var(--primary)'
                          }}>
                            {item.storage}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#000000'
                          }}>
                            {item.qty}
                          </td>
                          <td style={{ 
                            padding: '12px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '13px',
                            color: 'var(--text-secondary)'
                          }}>
                            {item.productId}
                          </td>
                          <td style={{ padding: '12px', color: '#000000' }}>
                            {item.productName}
                          </td>
                          <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                            {item.dueDate ? (
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                fontFamily: 'JetBrains Mono, monospace',
                                background: item.dueDate <= new Date().toISOString().split('T')[0]
                                  ? 'rgba(239,68,68,0.12)'
                                  : item.dueDate <= new Date(Date.now() + 2*86400000).toISOString().split('T')[0]
                                    ? 'rgba(245,158,11,0.15)'
                                    : 'rgba(0,200,83,0.1)',
                                color: item.dueDate <= new Date().toISOString().split('T')[0]
                                  ? '#dc2626'
                                  : item.dueDate <= new Date(Date.now() + 2*86400000).toISOString().split('T')[0]
                                    ? '#d97706'
                                    : '#059669'
                              }}>
                                {new Date(item.dueDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>–</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {!item.picked ? (
                              <button 
                                style={{
                                  padding: '6px 16px',
                                  background: 'var(--primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={() => {
                                  // Mark item as picked
                                  setPickingOrders(prev => prev.map(order => {
                                    if (order.orderId === item.orderId) {
                                      return {
                                        ...order,
                                        items: order.items.map(orderItem => {
                                          if (orderItem.productId === item.productId && 
                                              orderItem.storage === item.storage) {
                                            return { ...orderItem, picked: true };
                                          }
                                          return orderItem;
                                        })
                                      };
                                    }
                                    return order;
                                  }));
                                  
                                  // Reduce inventory
                                  let wasEmptied = false;
                                  let emptyLocation = '';
                                  let emptyProductName = '';
                                  
                                  setInventoryItems(prev => prev.map(inv => {
                                    if (inv.id === item.productId && inv.storage === item.storage) {
                                      const newStock = Math.max(0, inv.onStock - item.qty);
                                      // Check if location was emptied
                                      if (newStock === 0 && inv.onStock > 0) {
                                        wasEmptied = true;
                                        emptyLocation = inv.storage;
                                        emptyProductName = inv.productName;
                                      }
                                      return {
                                        ...inv,
                                        onStock: newStock
                                      };
                                    }
                                    return inv;
                                  }));
                                  
                                  // Create notification if location was emptied
                                  if (wasEmptied) {
                                    const newMessage = {
                                      id: Date.now(),
                                      type: 'replenishment',
                                      title: `Lagerplatz ${emptyLocation} komplett geleert`,
                                      message: `Durch Picking wurde ${emptyLocation} komplett leergeräumt.\n\nArtikel: ${emptyProductName}\n\nBitte Nachschub aus Reserve-Lager organisieren.`,
                                      timestamp: new Date().toLocaleString('de-DE'),
                                      read: false,
                                      priority: 'high'
                                    };
                                    setMessages(prev => [newMessage, ...prev]);
                                  }
                                  
                                  alert(`✓ ${item.qty}x ${item.productName} gepickt!\n📍 Lagerort: ${item.storage}\n📦 Order: ${item.orderId}${wasEmptied ? '\n\n⚠️ Lagerplatz jetzt leer - Nachricht an Lageristen gesendet!' : ''}`);
                                }}
                              >
                                ✓ Gepickt
                              </button>
                            ) : (
                              <span style={{ 
                                color: 'var(--success)', 
                                fontWeight: '600',
                                fontSize: '13px'
                              }}>
                                ✓ Gepickt
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Keine offenen Picks</h3>
                  <p style={{ marginTop: '8px' }}>Kommissionieraufträge werden hier angezeigt.</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // STOCKTAKING SCREEN
      if (currentScreen === 'stocktaking') {
        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
                </button>
                <button 
                  className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('shipping');
                    setCurrentScreen('shipping');
                  }}
                >
                  💻 Versand (Desktop)
                </button>
                <button 
                  className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                  onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
                >
                  🛒 Einkauf (Desktop)
                </button>
              </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={pickingOrders.filter(o => o.status !== 'handed_to_shipping').length}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: '24px' }}>
                📊 Stocktaking - Inventur
              </h2>

              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px',
                background: 'rgba(0, 102, 255, 0.05)',
                borderRadius: '12px',
                border: '2px dashed rgba(0, 102, 255, 0.3)'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700',
                  marginBottom: '12px',
                  color: 'var(--text-primary)'
                }}>
                  Inventur-Funktion
                </h3>
                <p style={{ 
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  maxWidth: '400px',
                  margin: '0 auto'
                }}>
                  Diese Funktion wird vom ERP-System übernommen und steht im WMS-Prototyp nicht zur Verfügung.
                </p>
              </div>
            </div>
          </div>
        );
      }

      // MESSAGES SCREEN
      if (currentScreen === 'messages') {
        const handleMarkAsRead = (messageId) => {
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, read: true } : m
          ));
        };

        const handleMarkAllAsRead = () => {
          setMessages(prev => prev.map(m => ({ ...m, read: true })));
        };

        const handleDeleteMessage = (messageId) => {
          if (window.confirm('Nachricht wirklich löschen?')) {
            setMessages(prev => prev.filter(m => m.id !== messageId));
          }
        };

        const unreadCount = messages.filter(m => !m.read).length;

        return (
          <div className="mobile-view">
            <div className="header">
              <div className="logo">
                <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
                <span className="logo-badge">Prototype</span>
              </div>
              <div className="view-switcher">
                <button 
                  className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentView('warehouse');
                    setCurrentScreen('incoming-orders');
                  }}
                >
                  📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
            </div>

            <NavigationMenu 
              currentScreen={currentScreen}
              setCurrentScreen={setCurrentScreen}
              receivedOrdersCount={receivedOrders.length}
              relocationOrdersCount={allDistributionItems.length}
              pickingOrdersCount={0}
              inventoryCount={inventoryItems.length}
              messagesCount={messages.filter(m => !m.read).length}
            />

            <div style={{ padding: '16px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px' 
              }}>
                <h2 className="section-title">
                  💬 Nachrichten
                  {unreadCount > 0 && (
                    <span style={{ 
                      marginLeft: '12px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      padding: '4px 12px',
                      borderRadius: '12px'
                    }}>
                      {unreadCount} ungelesen
                    </span>
                  )}
                </h2>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(0, 102, 255, 0.1)',
                      color: 'var(--primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Alle gelesen
                  </button>
                )}
              </div>

              {messages.length > 0 ? (
                <div className="delivery-list">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className="card"
                      style={{ 
                        borderLeft: message.read 
                          ? '4px solid rgba(168, 172, 184, 0.3)' 
                          : message.type === 'return'
                          ? '4px solid #dc2626'
                          : '4px solid var(--primary)',
                        background: message.read 
                          ? 'rgba(168, 172, 184, 0.05)' 
                          : 'var(--card-background)',
                        opacity: message.read ? 0.7 : 1
                      }}
                    >
                      <div className="card-header">
                        <div style={{ flex: 1 }}>
                          <div className="card-title" style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {message.type === 'return' && '↩️'}
                            {message.type === 'info' && 'ℹ️'}
                            {message.type === 'warning' && '⚠️'}
                            {message.title}
                          </div>
                          <div className="card-subtitle" style={{ 
                            marginTop: '6px',
                            fontSize: '14px'
                          }}>
                            {message.message}
                          </div>
                        </div>
                        {!message.read && (
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            flexShrink: 0
                          }}></span>
                        )}
                      </div>

                      {message.orderId && (
                        <div className="card-meta" style={{ marginTop: '8px' }}>
                          <span style={{ fontWeight: '600' }}>{message.orderId}</span>
                          {message.product && (
                            <>
                              <span>•</span>
                              <span>{message.product}</span>
                            </>
                          )}
                          {message.lpn && (
                            <>
                              <span>•</span>
                              <span style={{ 
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '11px'
                              }}>
                                {message.lpn}
                              </span>
                            </>
                          )}
                          {message.quantity && (
                            <>
                              <span>•</span>
                              <span>{formatNumberFull(message.quantity)} Stk</span>
                            </>
                          )}
                        </div>
                      )}

                      <div style={{ 
                        marginTop: '12px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <span>📅 {message.created}</span>
                      </div>

                      <div style={{ 
                        marginTop: '12px',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {!message.read && (
                          <button
                            onClick={() => handleMarkAsRead(message.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(0, 102, 255, 0.1)',
                              color: 'var(--primary)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Als gelesen markieren
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Keine Nachrichten</h3>
                  <p style={{ marginTop: '8px' }}>Neue Nachrichten werden hier angezeigt</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Default fallback (should not reach here)
      return (
        <div className="mobile-view">
          <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Unbekannter Screen</h3>
            <p style={{ marginTop: '8px' }}>Bitte wählen Sie einen Screen aus dem Menü.</p>
            <button 
              className="btn btn-primary"
              style={{ marginTop: '24px' }}
              onClick={() => setCurrentScreen('incoming-orders')}
            >
              Zu Incoming Orders
            </button>
          </div>
        </div>
      );
    }

    // Inventory Master Data Edit Modal
    function InventoryMasterDataEditModal({ item, onSave, onClose }) {
      const [formData, setFormData] = React.useState({
        dimensionsOne: item.dimensionsOne || { width: 0, height: 0, depth: 0, weight: 0 },
        dimensionsVPE: item.dimensionsVPE || { width: 0, height: 0, depth: 0, weight: 0, qty: 0 },
        minStockGeneral: item.minStockGeneral || 0,
        minStockMainLocation: item.minStockMainLocation || 0,
        mainLocation: item.mainLocation || item.storage
      });

      const handleSave = () => {
        onSave(formData);
        onClose();
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">✏️ Stammdaten bearbeiten</h2>
            <p className="modal-subtitle">{item.productName}</p>

            {/* Dimensions per One */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                📏 Maße pro Einzelstück
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Breite (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsOne.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsOne: { ...formData.dimensionsOne, width: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Höhe (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsOne.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsOne: { ...formData.dimensionsOne, height: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Tiefe (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsOne.depth}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsOne: { ...formData.dimensionsOne, depth: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Gewicht (kg)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    className="input-field"
                    value={formData.dimensionsOne.weight}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsOne: { ...formData.dimensionsOne, weight: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Dimensions per VPE */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                📦 Standard-VPE
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Menge pro VPE (Stk)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsVPE.qty}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsVPE: { ...formData.dimensionsVPE, qty: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Breite (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsVPE.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsVPE: { ...formData.dimensionsVPE, width: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Höhe (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsVPE.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsVPE: { ...formData.dimensionsVPE, height: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Tiefe (mm)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.dimensionsVPE.depth}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsVPE: { ...formData.dimensionsVPE, depth: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Gewicht (kg)</label>
                  <input 
                    type="number" 
                    step="0.001"
                    className="input-field"
                    value={formData.dimensionsVPE.weight}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensionsVPE: { ...formData.dimensionsVPE, weight: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Min Stocks */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                📊 Mindestbestände
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Gesamt-Mindestbestand (Stk)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.minStockGeneral}
                    onChange={(e) => setFormData({
                      ...formData,
                      minStockGeneral: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Hauptlagerplatz</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={formData.mainLocation}
                    onChange={(e) => setFormData({
                      ...formData,
                      mainLocation: e.target.value
                    })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Mindestbestand Hauptlagerplatz (Stk)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={formData.minStockMainLocation}
                    onChange={(e) => setFormData({
                      ...formData,
                      minStockMainLocation: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={handleSave}
              >
                ✓ Speichern
              </button>
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Delivery Note Upload Modal
    function DeliveryNoteUploadModal({ selectedDelivery, deliveryNote, setDeliveryNote, onConfirm, onClose }) {
      const fileInputRef = React.useRef(null);
      const [showWarning, setShowWarning] = React.useState(false);

      const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setDeliveryNote(event.target.result);
            setShowWarning(false);
          };
          reader.readAsDataURL(file);
        }
      };

      const handleContinue = () => {
        if (!deliveryNote) {
          setShowWarning(true);
        } else {
          onConfirm();
        }
      };

      const handleConfirmWithoutNote = () => {
        onConfirm();
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">📸 Lieferschein hochladen</h2>
            <p className="modal-subtitle">
              {selectedDelivery.orderId} - {selectedDelivery.supplier}
            </p>

            <div style={{ 
              background: 'rgba(168, 172, 184, 0.1)', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {deliveryNote ? (
                <div>
                  <img 
                    src={deliveryNote} 
                    alt="Lieferschein" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }} 
                  />
                  <button 
                    className="btn"
                    onClick={() => fileInputRef.current.click()}
                    style={{ fontSize: '14px' }}
                  >
                    🔄 Anderes Bild auswählen
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Fotografiere den Lieferschein oder wähle ein Bild aus
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current.click()}
                  >
                    📸 Foto aufnehmen / Bild auswählen
                  </button>
                </div>
              )}
              
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {showWarning && !deliveryNote && (
              <div style={{ 
                background: 'rgba(255, 160, 0, 0.1)', 
                padding: '16px', 
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid rgba(255, 160, 0, 0.3)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--warning)' }}>
                  ⚠️ Kein Lieferschein hochgeladen
                </div>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                  Sicher die Bestellung ohne Lieferschein buchen?
                </p>
                <div className="btn-group">
                  <button 
                    className="btn btn-success"
                    onClick={handleConfirmWithoutNote}
                  >
                    ✓ Ja, ohne Lieferschein buchen
                  </button>
                  <button 
                    className="btn"
                    onClick={() => setShowWarning(false)}
                    style={{ background: 'rgba(168, 172, 184, 0.2)' }}
                  >
                    ✗ Abbrechen
                  </button>
                </div>
              </div>
            )}

            {!showWarning && (
              <div className="btn-group">
                <button 
                  className="btn btn-success"
                  onClick={handleContinue}
                >
                  ➜ Weiter zur Bestätigung
                </button>
                <button 
                  className="btn"
                  onClick={onClose}
                  style={{ background: 'rgba(168, 172, 184, 0.2)' }}
                >
                  ✗ Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Confirm Booking Modal
    function ConfirmBookingModal({ selectedDelivery, deliveryNote, quantity, vpeUnits, onConfirm, onClose }) {
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">✓ Lieferung bestätigen</h2>
            <p className="modal-subtitle">
              Möchten Sie die folgende Lieferung endgültig buchen?
            </p>

            <div style={{ 
              background: 'rgba(168, 172, 184, 0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Bestellung:</strong> {selectedDelivery.orderId}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Lieferant:</strong> {selectedDelivery.supplier}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Menge:</strong> {formatNumberFull(quantity)} Stk
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Labels erstellt:</strong> {vpeUnits.length} VPE
              </div>
              <div>
                <strong>Lieferschein:</strong> {deliveryNote ? '✓ Hochgeladen' : '✗ Nicht vorhanden'}
              </div>
            </div>

            {deliveryNote && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img 
                  src={deliveryNote} 
                  alt="Lieferschein" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '2px solid var(--border-color)'
                  }} 
                />
              </div>
            )}

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={onConfirm}
                style={{ fontSize: '16px', fontWeight: '600' }}
              >
                ✓ Jetzt buchen
              </button>
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Notify Orderer Modal
    function NotifyOrdererModal({ selectedProduct, selectedDelivery, orderedQty, actualQty, onSend, onClose }) {
      const [message, setMessage] = React.useState('');
      const difference = actualQty - orderedQty;
      const isMore = difference > 0;
      
      const orderId = selectedDelivery ? selectedDelivery.orderId : 'AG 000000';
      const supplier = selectedDelivery ? selectedDelivery.supplier : 'Lieferant';
      const contact = selectedDelivery ? selectedDelivery.contact : null;
      
      const defaultMessage = `Hallo,

bei der Warenannahme für Bestellung ${orderId} wurde eine Mengenabweichung festgestellt:

Artikel: ${selectedProduct.name} (Art-Nr: ${selectedProduct.id})
Bestellt: ${formatNumberFull(orderedQty)} Stück
Geliefert: ${formatNumberFull(actualQty)} Stück
Differenz: ${isMore ? '+' : ''}${formatNumberFull(difference)} Stück

Bitte um Rückmeldung zum weiteren Vorgehen.

Mit freundlichen Grüßen`;

      React.useEffect(() => {
        setMessage(defaultMessage);
      }, []);

      const handleSend = () => {
        // Simulate sending email
        onSend(message);
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 className="modal-title">✉️ Nachricht an Besteller</h2>
            <p className="modal-subtitle">
              {contact ? `An: ${contact}` : 'An: Einkauf'}
            </p>

            <div style={{ 
              background: 'rgba(255, 160, 0, 0.1)', 
              padding: '12px 16px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 160, 0, 0.3)',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>📋 Bestellung:</div>
              <div>{orderId} - {supplier}</div>
            </div>

            <div className="input-group">
              <label className="input-label">Nachricht</label>
              <textarea 
                className="input-field"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="12"
                style={{
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={handleSend}
                disabled={!message.trim()}
              >
                ✉️ Nachricht senden
              </button>
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Quantity Deviation Modal
    function QuantityDeviationModal({ selectedProduct, orderedQty, actualQty, onDecision, onClose }) {
      const difference = actualQty - orderedQty;
      const isMore = difference > 0;
      
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠️ Mengenabweichung erkannt</h2>
            <p className="modal-subtitle">
              Artikel: {selectedProduct.name} (Art-Nr: {selectedProduct.id})
            </p>

            <div style={{ 
              background: 'rgba(255, 160, 0, 0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 160, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Bestellt:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatNumberFull(orderedQty)} Stk</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Tatsächlich:</span>
                <strong style={{ color: 'var(--warning)' }}>{formatNumberFull(actualQty)} Stk</strong>
              </div>
              <div style={{ 
                borderTop: '1px solid rgba(255, 160, 0, 0.3)', 
                marginTop: '8px', 
                paddingTop: '8px',
                display: 'flex', 
                justifyContent: 'space-between' 
              }}>
                <span style={{ fontWeight: '600' }}>Differenz:</span>
                <strong style={{ color: isMore ? 'var(--success)' : 'var(--danger)' }}>
                  {isMore ? '+' : ''}{formatNumberFull(difference)} Stk
                </strong>
              </div>
            </div>

            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Ist diese Abweichung bewusst? Wie soll verfahren werden?
            </p>

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={() => onDecision('update-order')}
              >
                📝 Bestand anpassen
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                  Bestellung wird auf {formatNumberFull(actualQty)} Stk geändert
                </div>
              </button>

              <button 
                className="btn btn-primary"
                onClick={() => onDecision('partial-delivery')}
              >
                📦 Teillieferung buchen
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                  {formatNumberFull(actualQty)} Stk einbuchen, Rest bleibt offen
                </div>
              </button>

              <button 
                className="btn"
                onClick={() => onDecision('notify-orderer')}
                style={{ 
                  background: 'rgba(255, 160, 0, 0.2)',
                  color: 'var(--warning)',
                  border: '1px solid var(--warning)'
                }}
              >
                ✉️ Nachricht an Besteller
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                  Abweichung per E-Mail melden
                </div>
              </button>

              <button 
                className="btn"
                onClick={() => onDecision('cancel')}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    function OverdeliveryModal({ selectedProduct, orderedQty, actualQty, difference, onDecision, onClose }) {
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠️ Überlieferung erkannt</h2>
            <p className="modal-subtitle">
              Artikel: {selectedProduct.name}
            </p>

            <div style={{ 
              background: 'rgba(255, 193, 7, 0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '24px',
              border: '2px solid rgba(255, 193, 7, 0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Bestellt:</span>
                <strong>{formatNumberFull(orderedQty)} Stk</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '600' }}>Geliefert:</span>
                <strong style={{ color: '#d97706' }}>{formatNumberFull(actualQty)} Stk</strong>
              </div>
              <div style={{ 
                borderTop: '2px solid rgba(255, 193, 7, 0.3)', 
                marginTop: '12px', 
                paddingTop: '12px',
                display: 'flex', 
                justifyContent: 'space-between' 
              }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Überhang:</span>
                <strong style={{ color: '#d97706', fontSize: '18px' }}>
                  +{formatNumberFull(difference)} Stk
                </strong>
              </div>
            </div>

            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Es wurden {formatNumberFull(difference)} Stück mehr geliefert als bestellt.<br/>
              Wie soll verfahren werden?
            </p>

            <div className="btn-group">
              <button 
                className="btn btn-primary"
                onClick={() => onDecision('all')}
                style={{ padding: '20px' }}
              >
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                  ✅ Alles einlagern
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {formatNumberFull(actualQty)} Stk auf den Lagerplatz buchen
                </div>
              </button>

              <button 
                className="btn"
                onClick={() => onDecision('separate')}
                style={{ 
                  padding: '20px',
                  background: 'rgba(255, 193, 7, 0.2)',
                  border: '2px solid #d97706',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                  📦 Überhang separieren
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {formatNumberFull(orderedQty)} Stk → Lagerplatz<br/>
                  {formatNumberFull(difference)} Stk → KLÄRPLATZ
                </div>
              </button>

              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
            
            <div style={{
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(0, 102, 255, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--primary)'
            }}>
              ℹ️ Der Einkäufer wird automatisch über die Überlieferung informiert
            </div>
          </div>
        </div>
      );
    }

    // Quality Split Modal - Scenario C
    function QualitySplitModal({ 
      selectedProduct, 
      selectedDelivery,
      totalQty,
      qualityOkQty, 
      setQualityOkQty,
      qualityDefectQty,
      setQualityDefectQty,
      qualityReason,
      setQualityReason,
      qualityPhoto,
      setQualityPhoto,
      onConfirm,
      onClose 
    }) {
      const fileInputRef = React.useRef(null);
      
      // Auto-calculate defect qty
      React.useEffect(() => {
        setQualityDefectQty(totalQty - qualityOkQty);
      }, [qualityOkQty, totalQty]);
      
      const handlePhotoCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setQualityPhoto(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      
      const canConfirm = qualityOkQty >= 0 && qualityDefectQty > 0 && qualityReason && qualityPhoto;
      
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title" style={{ color: '#ef4444' }}>⚠️ Qualitäts-Mangel melden</h2>
            <p className="modal-subtitle">
              Artikel: {selectedProduct.name}
            </p>

            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  OK-Menge (einlagerbar):
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={qualityOkQty}
                  onChange={(e) => setQualityOkQty(parseInt(e.target.value) || 0)}
                  max={totalQty}
                  min={0}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>
                  Defekt-Menge (Sperrlager):
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={qualityDefectQty}
                  readOnly
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '700' }}
                />
              </div>
              
              <div style={{ 
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#ef4444'
              }}>
                Gesamt: {totalQty} Stk = {qualityOkQty} OK + {qualityDefectQty} Defekt
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Grund: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select 
                className="input-field"
                value={qualityReason}
                onChange={(e) => setQualityReason(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Bitte wählen...</option>
                <option value="Transportschaden">Transportschaden</option>
                <option value="Produktionsfehler">Produktionsfehler</option>
                <option value="Beschädigung">Beschädigung</option>
                <option value="Falsche Ware">Falsche Ware</option>
                <option value="Verfärbung">Verfärbung</option>
                <option value="Defekt">Defekt / Funktioniert nicht</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Foto: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                style={{ display: 'none' }}
              />
              
              {!qualityPhoto ? (
                <button
                  className="btn"
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%',
                    padding: '40px',
                    background: 'rgba(168, 172, 184, 0.1)',
                    border: '2px dashed var(--border-color)'
                  }}
                >
                  📷 Foto vom Schaden aufnehmen
                </button>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={qualityPhoto} 
                    alt="Schaden" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '8px',
                      border: '2px solid var(--border-color)'
                    }}
                  />
                  <button
                    className="btn"
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      background: 'rgba(168, 172, 184, 0.2)'
                    }}
                  >
                    📷 Neues Foto aufnehmen
                  </button>
                </div>
              )}
            </div>

            <div style={{
              padding: '12px',
              background: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 193, 7, 0.5)'
            }}>
              <strong>ℹ️ Hinweis:</strong> Es werden 2 getrennte Labels erstellt:<br/>
              • {qualityOkQty} Stk → Label "ZIEL: LAGER"<br/>
              • {qualityDefectQty} Stk → Label "ZIEL: SPERRLAGER"
            </div>

            <div className="btn-group">
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                Abbrechen
              </button>
              <button 
                className="btn"
                onClick={onConfirm}
                disabled={!canConfirm}
                style={{ 
                  background: canConfirm ? '#ef4444' : 'rgba(168, 172, 184, 0.2)',
                  color: canConfirm ? 'white' : 'var(--text-secondary)',
                  cursor: canConfirm ? 'pointer' : 'not-allowed'
                }}
              >
                ✓ Mangel bestätigen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // VPE Split Modal
    function VpeSplitModal({ selectedProduct, totalQty, vpeQuantities, handleVpeQuantityChange, handleVpeFieldBlur, handleVpeFieldKeyPress, handleRemoveVpeField, onConfirm, onClose }) {
      const sum = vpeQuantities.reduce((a, b) => a + b, 0);
      const remaining = totalQty - sum;
      
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2 className="modal-title">📦 VPE-Aufteilung</h2>
            <p className="modal-subtitle">
              Trage die Mengen für jede Verpackungseinheit (Label) ein
            </p>

            <div style={{ 
              background: 'rgba(168, 172, 184, 0.1)', 
              padding: '16px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Gesamtmenge:</span>
                <strong>{formatNumberFull(totalQty)} Stk</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Bereits eingegeben:</span>
                <strong style={{ color: sum === totalQty ? 'var(--success)' : sum > totalQty ? 'var(--danger)' : 'var(--warning)' }}>
                  {formatNumberFull(sum)} Stk
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Noch offen:</span>
                <strong style={{ color: remaining === 0 ? 'var(--success)' : 'var(--warning)' }}>
                  {formatNumberFull(remaining)} Stk
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                VPE-Mengen:
              </div>
              
              {vpeQuantities.map((qty, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <div style={{ 
                    minWidth: '60px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                  }}>
                    VPE {index + 1}:
                  </div>
                  <input 
                    type="number" 
                    className="input-field"
                    value={qty || ''}
                    placeholder="Menge eingeben..."
                    min="0"
                    max={totalQty}
                    data-vpe-index={index}
                    onChange={(e) => handleVpeQuantityChange(index, e.target.value)}
                    onBlur={() => handleVpeFieldBlur(index)}
                    onKeyPress={(e) => handleVpeFieldKeyPress(e, index)}
                    autoFocus={index === 0}
                    style={{ flex: 1 }}
                  />
                  {vpeQuantities.length > 1 && (
                    <button
                      onClick={() => handleRemoveVpeField(index)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✗
                    </button>
                  )}
                </div>
              ))}
            </div>

            {sum === totalQty && (
              <div style={{ 
                background: 'rgba(0, 200, 83, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(0, 200, 83, 0.3)',
                color: 'var(--success)',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ✓ Gesamtmenge erreicht! ({vpeQuantities.filter(q => q > 0).length} VPEs)
              </div>
            )}

            {sum > totalQty && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '12px', 
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ⚠️ Zu viel! {formatNumberFull(sum - totalQty)} Stk über Gesamtmenge
              </div>
            )}

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={onConfirm}
                disabled={sum !== totalQty}
                style={{
                  opacity: sum !== totalQty ? 0.5 : 1,
                  cursor: sum !== totalQty ? 'not-allowed' : 'pointer'
                }}
              >
                ✓ VPE-Aufteilung bestätigen
              </button>
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ✗ Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Split Modal
    function SplitModal({ selectedProduct, quantity, splitQtyPrimary, setSplitQtyPrimary, onConfirm, onClose }) {
      const splitQtyReserve = quantity - splitQtyPrimary;
      const vpeCount = Math.floor(quantity / selectedProduct.vpe);
      const looseUnits = quantity % selectedProduct.vpe;

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚡ Ziel-Zuweisung</h2>
            <p className="modal-subtitle">
              Artikel: {selectedProduct.name} (Art-Nr: {selectedProduct.id})
            </p>
            {selectedProduct.supplierName && (
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '13px',
                marginTop: '-12px',
                marginBottom: '20px'
              }}>
                {selectedProduct.supplierName}
              </p>
            )}

            <div style={{ 
              background: 'rgba(168, 172, 184, 0.1)', 
              padding: '12px 16px', 
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gesamtmenge:</span>
                <strong>{formatNumberFull(quantity)} Stk ({formatNumber(quantity)})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gebinde:</span>
                <strong>{formatNumberFull(vpeCount)} {selectedProduct.vpeUnit} {looseUnits > 0 && `+ ${formatNumberFull(looseUnits)} lose Stk`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>1 VPE =</span>
                <strong>{formatNumberFull(selectedProduct.vpe)} Stück</strong>
              </div>
            </div>

            <div className="location-info">
              <div className="location-title">🎯 Primärplatz (Grüner Punkt)</div>
              <div className="location-text">
                Ziel: <span className="location-highlight">{selectedProduct.primaryLocation.code}</span> 
                <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  ({selectedProduct.primaryLocation.zone})
                </span>
              </div>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '13px', 
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '16px'
              }}>
                <span>📊 Min: {selectedProduct.primaryLocation.binMin}</span>
                <span>📈 Max: {selectedProduct.primaryLocation.binMax}</span>
                <span>🔢 Route: #{selectedProduct.primaryLocation.routingIndex}</span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '14px' }}>
                Passen die <strong>{formatNumberFull(quantity)}</strong> Stück dort physisch rein?
              </div>
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={() => {
                  setSplitQtyPrimary(quantity);
                  onConfirm();
                }}
              >
                ✓ Ja, alles nach {selectedProduct.primaryLocation.code}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // Show split input
                }}
              >
                ✂️ Nein, aufteilen (Split)
              </button>
            </div>

            <div style={{ marginTop: '24px' }}>
              <div className="input-group">
                <label className="input-label">Menge für {selectedProduct.primaryLocation.code} (Primär)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={splitQtyPrimary}
                  onChange={(e) => setSplitQtyPrimary(parseInt(e.target.value) || 0)}
                  max={quantity}
                />
              </div>

              <div className="location-info" style={{ background: 'rgba(168, 172, 184, 0.1)', borderColor: 'var(--text-secondary)' }}>
                <div className="location-title" style={{ color: 'var(--text-secondary)' }}>📦 Reserve</div>
                <div className="location-text">
                  Automatisch: <strong>{formatNumberFull(splitQtyReserve)} Stück ({formatNumber(splitQtyReserve)})</strong> nach {selectedProduct.reserveLocation.code}
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    ({selectedProduct.reserveLocation.zone})
                  </span>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)'
                }}>
                  🔢 Route: #{selectedProduct.reserveLocation.routingIndex}
                </div>
              </div>

              <button className="btn btn-primary" onClick={onConfirm} style={{ width: '100%', marginTop: '16px' }}>
                📄 Buchen & Drucken
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Label Preview Modal
    function LabelPreviewModal({ selectedProduct, splitQtyPrimary, totalQty, vpeSize, vpeUnits, orderId, pdfOpened, setPdfOpened, onClose, onFinish, onBookDelivery }) {
      const splitQtyReserve = totalQty - splitQtyPrimary;
      const today = new Date().toLocaleDateString('de-DE');
      
      // GROUP VPE UNITS by quantity - only show unique labels with multiplier badge
      const vpeGroups = vpeUnits.reduce((groups, unit) => {
        const existing = groups.find(g => g.qty === unit.qty);
        if (existing) {
          existing.count++;
          existing.units.push(unit);
        } else {
          groups.push({
            qty: unit.qty,
            count: 1,
            units: [unit],
            firstUnit: unit  // Use first unit as template for display
          });
        }
        return groups;
      }, []);
      
      React.useEffect(() => {
        // Generate QR codes only for UNIQUE labels (one per group)
        vpeGroups.forEach((group, index) => {
          const qrElement = document.getElementById(`qr-${index}`);
          if (qrElement) {
            qrElement.innerHTML = ''; // Clear previous
            new QRCode(qrElement, {
              text: `https://crm.rrdc.de/crm/erp/products/${selectedProduct.id}`,
              width: 100,
              height: 100
            });
          }
        });

        // Generate barcodes with LPN for first unit in each group
        vpeGroups.forEach((group, index) => {
          const barcodeElement = document.getElementById(`barcode-${index}`);
          if (barcodeElement && group.firstUnit.lpn) {
            JsBarcode(barcodeElement, group.firstUnit.lpn, {
              format: "CODE128",
              width: 2,
              height: 50,
              displayValue: true,
              fontSize: 12,
              margin: 5
            });
          }
        });
      }, [vpeGroups]);

      const generatePDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [100, 150] // 10x15cm
        });

        // PRINT ALL LABELS (loop through each unit in each group)
        let pageIndex = 0;
        vpeGroups.forEach((group) => {
          group.units.forEach((unit) => {
            if (pageIndex > 0) doc.addPage();
            
            // Header
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(orderId, 10, 10);
            doc.text(today, 130, 10);
            
            // Product Name
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            const productName = selectedProduct.name;
            if (productName.length > 30) {
              doc.text(productName.substring(0, 30), 10, 25);
              doc.text(productName.substring(30, 60), 10, 32);
            } else {
              doc.text(productName, 10, 25);
            }
            
            // Variant (if present)
            if (selectedProduct.variant) {
              doc.setFontSize(12);
              doc.setTextColor(0, 102, 255);
              doc.setFont(undefined, 'bold');
              doc.text(selectedProduct.variant, 10, productName.length > 30 ? 38 : 32);
            }
            
            // Quantity - LARGE, right-aligned
            doc.setFontSize(48);
            doc.setTextColor(0, 102, 255);
            doc.text(`${unit.qty} Stk`, 140, 55, { align: 'right' });
            
            // Product ID
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.setFont(undefined, 'normal');
            doc.text(`Art-Nr: ${selectedProduct.id}`, 10, 45);
            
            // LPN - License Plate Number (UNIQUE for each label!)
            if (unit.lpn) {
              doc.setFontSize(14);
              doc.setTextColor(0, 102, 255);
              doc.setFont(undefined, 'bold');
              doc.text(unit.lpn, 10, 52);
            }
            
            // QR Code - generate inline
            try {
              const qrData = `https://crm.rrdc.de/crm/erp/products/${selectedProduct.id}`;
              const qr = window.qrcodegen.QrCode.encodeText(qrData, window.qrcodegen.QrCode.Ecc.MEDIUM);
              const svg = qr.toSvgString(2);
              doc.addImage(`data:image/svg+xml;base64,${btoa(svg)}`, 'SVG', 10, 55, 30, 30);
            } catch (e) {
              console.error('QR generation failed:', e);
            }
            
            // Destination (if specified)
            if (unit.destination) {
              doc.setFontSize(16);
              doc.setTextColor(0, 102, 255);
              doc.setFont(undefined, 'bold');
              doc.text(`ZIEL: ${unit.destination}`, 140, 65, { align: 'right' });
            }
            
            // Barcode - generate inline using JsBarcode
            try {
              const canvas = document.createElement('canvas');
              window.JsBarcode(canvas, unit.lpn, {
                format: 'CODE128',
                width: 2,
                height: 40,
                displayValue: false
              });
              const barcodeDataUrl = canvas.toDataURL('image/png');
              doc.addImage(barcodeDataUrl, 'PNG', 50, unit.destination ? 75 : 70, 90, 20);
            } catch (e) {
              console.error('Barcode generation failed:', e);
            }
            
            pageIndex++;
          });
        });

        // Open PDF in new window
        window.open(doc.output('bloburl'), '_blank');
        
        // DIREKT BUCHEN nach PDF-Druck!
        onBookDelivery();
      };

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}>
            <h2 className="modal-title">🏷️ Label-Vorschau</h2>
            <p className="modal-subtitle">
              {vpeUnits.length} Label{vpeUnits.length > 1 ? 's' : ''} für {selectedProduct.name}
              {vpeGroups.length < vpeUnits.length && (
                <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  ({vpeGroups.length} unterschiedliche)
                </span>
              )}
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {vpeGroups.map((group, index) => (
                <div key={index} style={{
                  background: 'white',
                  border: '2px solid #ccc',
                  borderRadius: '8px',
                  padding: '16px',
                  aspectRatio: '1.5',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {/* Multiplier Badge (top right) */}
                  {group.count > 1 && (
                    <div style={{ 
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#0066FF',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {group.count}x
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    fontSize: '10px',
                    color: '#666'
                  }}>
                    <span style={{ fontWeight: '600' }}>{orderId}</span>
                    <span>{today}</span>
                  </div>

                  {/* Product Name */}
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '700',
                    color: '#000',
                    marginBottom: '4px',
                    lineHeight: '1.2'
                  }}>
                    {selectedProduct.name}
                  </div>

                  {/* Variant */}
                  {selectedProduct.variant && (
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '700',
                      color: '#0066FF',
                      marginBottom: '8px'
                    }}>
                      {selectedProduct.variant}
                    </div>
                  )}

                  {/* Product ID */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    Art-Nr: {selectedProduct.id}
                  </div>

                  {/* LPN - License Plate Number (first unit as example) */}
                  {group.firstUnit.lpn && (
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '700',
                      color: '#0066FF',
                      fontFamily: 'JetBrains Mono, monospace',
                      background: 'rgba(0, 102, 255, 0.1)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      display: 'inline-block'
                    }}>
                      {group.firstUnit.lpn}
                      {group.count > 1 && (
                        <span style={{ fontSize: '11px', marginLeft: '6px', opacity: 0.7 }}>
                          +{group.count - 1} weitere
                        </span>
                      )}
                    </div>
                  )}

                  {/* Destination */}
                  {group.firstUnit.destination && (
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '700',
                      color: group.firstUnit.destination === 'KLÄRPLATZ' ? '#ef4444' : '#0066FF',
                      background: group.firstUnit.destination === 'KLÄRPLATZ' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 102, 255, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      textAlign: 'right',
                      border: `2px solid ${group.firstUnit.destination === 'KLÄRPLATZ' ? '#ef4444' : '#0066FF'}`
                    }}>
                      🎯 ZIEL: {group.firstUnit.destination}
                    </div>
                  )}

                  {/* Main Content Area */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '12px'
                  }}>
                    {/* QR Code */}
                    <div id={`qr-${index}`} style={{ 
                      width: '80px', 
                      height: '80px',
                      flexShrink: 0
                    }}></div>

                    {/* Quantity - LARGE, right-aligned */}
                    <div style={{
                      flex: 1,
                      textAlign: 'right',
                      paddingTop: '10px'
                    }}>
                      <div style={{ 
                        fontSize: '48px', 
                        fontWeight: '700',
                        color: '#0066FF',
                        lineHeight: '1'
                      }}>
                        {group.qty}
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#0066FF',
                        marginTop: '4px'
                      }}>
                        Stk
                      </div>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div style={{ 
                    textAlign: 'center',
                    marginTop: '12px'
                  }}>
                    <canvas id={`barcode-${index}`}></canvas>
                  </div>
                </div>
              ))}
            </div>

            <div className="btn-group">
              <button 
                className="btn btn-success"
                onClick={generatePDF}
                style={{ fontSize: '16px', fontWeight: '600' }}
              >
                🖨️ Alle {vpeUnits.length} Labels drucken & buchen
              </button>
              <button 
                className="btn"
                onClick={onClose}
                style={{ background: 'rgba(168, 172, 184, 0.2)' }}
              >
                ← Zurück
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Shipping View
    function ShippingView({ currentView, setCurrentView, setCurrentScreen, orders, pickingOrders, selectedOrder, setSelectedOrder, handleShip, showModal, setShowModal, modalType, setModalType, handleConfirmWarning }) {
      const handleWarningClick = (order) => {
        setSelectedOrder(order);
        setModalType('warning');
        setShowModal(true);
      };
      
      // Check if order has been handed to shipping
      const isOrderReadyForShipping = (orderId) => {
        const pickingOrder = pickingOrders.find(po => po.orderId === orderId);
        if (!pickingOrder) return false;
        return pickingOrder.status === 'handed_to_shipping';
      };

      return (
        <div className="desktop-view">
          <div className="header">
            <div className="logo">
              <img src="https://images.raceresult.com/website/logo-red.svg" alt="RACE RESULT" style={{ height: '28px', width: 'auto' }} />
              <span className="logo-badge">Prototype</span>
            </div>
            <div className="view-switcher">
              <button 
                className={`view-btn ${currentView === 'warehouse' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('warehouse');
                  setCurrentScreen('incoming-orders');
                }}
              >
                📱 Lager (Mobile)
              </button>
              <button 
                className={`view-btn ${currentView === 'shipping' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shipping');
                  setCurrentScreen('shipping');
                }}
              >
                💻 Versand (Desktop)
              </button>
              <button 
                className={`view-btn ${currentView === 'purchasing' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('purchasing');
                  setCurrentScreen('purchasing');
                }}
              >
                🛒 Einkauf (Desktop)
              </button>
            </div>
          </div>

          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>
            📦 Versandliste
          </h2>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>C/ID</th>
                  <th>Kd-Nr</th>
                  <th>Kunde</th>
                  <th>Artikel</th>
                  <th>Lagerort</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const readyForShipping = isOrderReadyForShipping(order.id);
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="order-id-badge">{order.id}</span>
                      </td>
                      <td style={{ 
                        fontFamily: 'JetBrains Mono, monospace', 
                        fontWeight: '600',
                        fontSize: '13px',
                        color: 'var(--text-secondary)'
                      }}>
                        {order.custNo}
                      </td>
                      <td style={{ fontWeight: '600' }}>{order.customer}</td>
                      <td>{order.product}</td>
                      <td>
                        <div className="location-cell">
                          {readyForShipping ? (
                            <>
                              <span style={{ 
                                fontFamily: 'JetBrains Mono, monospace',
                                fontWeight: '700',
                                color: 'var(--success)',
                                background: 'rgba(0, 200, 83, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                Picked
                              </span>
                              <span className="icon-success">✓</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {order.location.code}
                              </span>
                              <span className="icon-success">🟢</span>
                              {order.warning && (
                                <span 
                                  className="icon-warning" 
                                  onClick={() => handleWarningClick(order)}
                                  title="⚠️ Lagerbestand-Warnung - Klicken für Details"
                                  style={{ cursor: 'pointer' }}
                                >
                                  ⚠️
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {!readyForShipping && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'var(--text-secondary)', 
                            marginTop: '4px' 
                          }}>
                            {order.location.zone} • Route #{order.location.routingIndex}
                          </div>
                        )}
                        {readyForShipping && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: 'var(--success)', 
                            marginTop: '4px',
                            fontWeight: '600'
                          }}>
                            Bereit zum Packen
                          </div>
                        )}
                      </td>
                      <td>
                        {order.status === 'ready' && (
                          <button 
                            className="btn-ship"
                            onClick={() => handleShip(order.id)}
                          >
                            Ship
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          <button className="btn-ship shipping loading">
                            Druckt...
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button className="btn-ship shipped">
                            Gedruckt ✓
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Alle AG-Aufträge abgearbeitet!</h3>
              <p style={{ marginTop: '8px' }}>Großartige Arbeit! 🎉</p>
            </div>
          )}

          {showModal && modalType === 'warning' && selectedOrder && (
            <WarningModal 
              order={selectedOrder}
              onConfirm={() => {
                handleConfirmWarning(selectedOrder);
              }}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      );
    }

    // Warning Modal
    function WarningModal({ order, onConfirm, onClose }) {
      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">⚠️ Hauptlager {order.location.code} leer!</h2>
            <p className="modal-subtitle">
              Bitte Ware von Alternative entnehmen.
            </p>

            {/* Original Location - Empty */}
            <div style={{ 
              padding: '16px',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              marginBottom: '16px',
              marginTop: '20px',
              background: 'rgba(239, 68, 68, 0.05)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: '#ef4444' }}>
                    ❌ {order.location.code} (Hauptlager)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {order.location.zone} • Route #{order.location.routingIndex}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#ef4444',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  0 Stk
                </div>
              </div>
            </div>

            {/* Alternative Location - Available */}
            {order.alternativeLocation && (
              <div style={{ 
                padding: '16px',
                border: '2px solid var(--success)',
                borderRadius: '8px',
                background: 'rgba(0, 200, 83, 0.05)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px', color: 'var(--success)' }}>
                      ✓ {order.alternativeLocation.code} (Alternative)
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {order.alternativeLocation.zone} • Route #{order.alternativeLocation.routingIndex}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--success)',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    Verfügbar
                  </div>
                </div>
              </div>
            )}

            <div style={{ 
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(255, 160, 0, 0.1)',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#d97706',
              border: '1px solid rgba(255, 160, 0, 0.3)'
            }}>
              <strong>ℹ️ Info:</strong> Bestand wird automatisch von {order.alternativeLocation?.code} abgezogen. Lageristen wird benachrichtigt um {order.location.code} nachzufüllen.
            </div>

            <div className="btn-group" style={{ marginTop: '20px' }}>
              <button 
                className="btn btn-success" 
                onClick={() => onConfirm()}
              >
                ✓ Verstanden - Drucken & Versenden
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Render App
    ReactDOM.render(<App />, document.getElementById('root'));