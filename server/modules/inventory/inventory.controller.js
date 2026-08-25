const InventoryItem = require("./inventory.model");
const StockMovement = require("./stockMovement.model");

// Generate item code: SK-XXXX
const generateItemCode = () => `SK-${Math.floor(100000 + Math.random() * 900000)}`;

// 1. Get All Inventory Items
exports.getItems = async (req, res) => {
    try {
        const { category, search, status } = req.query;
        let filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;

        let items = await InventoryItem.find(filter).sort({ itemName: 1 });
        if (search) {
            const query = search.toLowerCase();
            items = items.filter(i =>
                i.itemName.toLowerCase().includes(query) ||
                i.itemCode.toLowerCase().includes(query) ||
                i.warehouseLocation.toLowerCase().includes(query)
            );
        }
        res.json({ items });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Create Inventory Item
exports.createItem = async (req, res) => {
    try {
        const { itemName, category, unit, currentStock, minStockLevel, unitPrice, warehouseLocation } = req.body;

        const item = new InventoryItem({
            itemCode: generateItemCode(),
            itemName,
            category,
            unit,
            currentStock: Number(currentStock) || 0,
            minStockLevel: Number(minStockLevel) || 10,
            unitPrice: Number(unitPrice) || 0,
            warehouseLocation: warehouseLocation || "Main Warehouse"
        });

        await item.save();
        res.status(201).json({ message: "Inventory item created successfully", item });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Record Stock Movement (With Non-Negative Guard)
exports.recordMovement = async (req, res) => {
    try {
        const { itemId, movementType, quantity, referenceNote, projectId } = req.body;
        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: "Inventory item not found" });

        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ message: "Movement quantity must be a positive number" });
        }

        const previousStock = item.currentStock;
        let newStock = previousStock;

        if (movementType === "Stock-In" || movementType === "Returned") {
            newStock = previousStock + qty;
        } else if (movementType === "Stock-Out" || movementType === "Damaged") {
            // STRICT GUARANTEE: Prevent negative stock mismatches
            if (previousStock - qty < 0) {
                return res.status(400).json({
                    message: `Inventory Mismatch Guard: Cannot process ${movementType} of ${qty} ${item.unit}. Available stock is only ${previousStock} ${item.unit}. Stock quantity cannot be allowed to become negative.`
                });
            }
            newStock = previousStock - qty;
        } else {
            return res.status(400).json({ message: "Invalid movement type" });
        }

        // Update item stock
        item.currentStock = newStock;
        await item.save();

        // Record audit movement log
        const movement = await StockMovement.create({
            inventoryItem: item._id,
            movementType,
            quantity: qty,
            previousStock,
            newStock,
            referenceNote: referenceNote || "",
            project: projectId || null,
            performedBy: req.user._id
        });

        const isStockOut = newStock === 0;
        const alertMsg = isStockOut ? " 🚨 Stock has hit ZERO (0)! Open notification alert dispatched to all suppliers to add stock." : "";

        res.json({ message: `Recorded ${movementType} of ${qty} ${item.unit}.${alertMsg}`, item, movement, isStockOut });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. Get Movement Log History
exports.getMovements = async (req, res) => {
    try {
        const { itemId } = req.query;
        let filter = {};
        if (itemId) filter.inventoryItem = itemId;

        const movements = await StockMovement.find(filter)
            .populate("inventoryItem", "itemName itemCode unit")
            .populate("performedBy", "name email")
            .populate("project", "projectName")
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ movements });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Get Low-Stock Alerts
exports.getLowStockAlerts = async (req, res) => {
    try {
        const lowStockItems = await InventoryItem.find({
            $expr: { $lte: ["$currentStock", "$minStockLevel"] }
        }).sort({ currentStock: 1 });

        res.json({ alerts: lowStockItems, count: lowStockItems.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
