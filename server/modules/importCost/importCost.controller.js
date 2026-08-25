const ImportCost = require("./importCost.model");
const InventoryItem = require("../inventory/inventory.model");
const StockMovement = require("../inventory/stockMovement.model");
const { getExchangeRates, convertToBDT } = require("./currencyService");

// Generate item code: SK-XXXX
const generateItemCode = () => `SK-${Math.floor(100000 + Math.random() * 900000)}`;

// 1. Get Live / Fallback Exchange Rates
exports.getRates = async (req, res) => {
    try {
        const rateInfo = await getExchangeRates();
        res.json(rateInfo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Calculate & Submit Import/Product Request Cost
exports.calculateImportCost = async (req, res) => {
    try {
        const {
            title,
            itemName = "",
            category = "Cement & Concrete",
            quantity = 1,
            unit = "Units",
            warehouseLocation = "Central Depot",
            foreignCurrency = "USD",
            productCost = 0,
            shippingCost = 0,
            customsDuty = 0,
            taxVAT = 0,
            otherCharges = 0,
            expectedSellingValueBDT = 0,
            saveRecord = false,
            notes = ""
        } = req.body;

        const rateData = await getExchangeRates();
        const rate = rateData.rates[foreignCurrency] || 1.0;

        // Sum foreign components if currency is foreign, convert total to BDT
        const totalForeignCost = Number(productCost) + Number(shippingCost) + Number(customsDuty) + Number(taxVAT) + Number(otherCharges);
        const totalImportCostBDT = Number((totalForeignCost * rate).toFixed(2));

        const expectedSalesBDT = Number(expectedSellingValueBDT) || 0;
        const estimatedProfitBDT = Number((expectedSalesBDT - totalImportCostBDT).toFixed(2));
        const profitMarginPercent = expectedSalesBDT > 0
            ? Number(((estimatedProfitBDT / expectedSalesBDT) * 100).toFixed(2))
            : 0;

        const calculationResult = {
            title: title || (itemName ? `Requisition for ${itemName}` : "Import Requisition"),
            itemName: itemName || title || "Imported Material",
            category,
            quantity: Number(quantity) || 1,
            unit: unit || "Units",
            warehouseLocation: warehouseLocation || "Central Depot",
            foreignCurrency,
            exchangeRate: rate,
            isFallbackRate: rateData.isFallback,
            rateSource: rateData.source,
            productCost: Number(productCost) || 0,
            shippingCost: Number(shippingCost) || 0,
            customsDuty: Number(customsDuty) || 0,
            taxVAT: Number(taxVAT) || 0,
            otherCharges: Number(otherCharges) || 0,
            breakdownBDT: {
                productCostBDT: Number((productCost * rate).toFixed(2)),
                shippingCostBDT: Number((shippingCost * rate).toFixed(2)),
                customsDutyBDT: Number((customsDuty * rate).toFixed(2)),
                taxVATBDT: Number((taxVAT * rate).toFixed(2)),
                otherChargesBDT: Number((otherCharges * rate).toFixed(2))
            },
            totalImportCostBDT,
            expectedSellingValueBDT: expectedSalesBDT,
            estimatedProfitBDT,
            profitMarginPercent,
            isProfitable: estimatedProfitBDT >= 0,
            managerApprovalStatus: "Pending Manager Approval",
            financeApprovalStatus: "Pending Finance Approval",
            receivingStatus: "Not Received"
        };

        if (saveRecord) {
            if (req.user?.role === "accounts_officer") {
                return res.status(403).json({ message: "Forbidden: Finance role is restricted strictly to verification and approval mode." });
            }
            const savedDoc = await ImportCost.create({
                ...calculationResult,
                notes,
                calculatedBy: req.user._id
            });
            calculationResult._id = savedDoc._id;
        }

        res.json(calculationResult);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Manager Approval Endpoint for Import / Product Orders
exports.verifyImportOrderManager = async (req, res) => {
    try {
        const { status = "Manager Approved", notes = "" } = req.body;
        const record = await ImportCost.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Import record not found" });

        record.managerApprovalStatus = status;
        record.approvedByManager = req.user._id;
        if (notes) record.notes = notes;
        await record.save();

        res.json({ message: `Import requisition status updated to "${status}".`, record });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to update manager approval status" });
    }
};

// 4. Finance Approval Endpoint for Import / Product Orders
exports.verifyImportOrderFinance = async (req, res) => {
    try {
        const { status = "Finance Approved", approvalNotes = "" } = req.body;
        const record = await ImportCost.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Import record not found" });

        record.financeApprovalStatus = status;
        record.approvedByFinance = req.user._id;
        if (approvalNotes) record.approvalNotes = approvalNotes;
        await record.save();

        res.json({ message: `Import order status updated to "${status}".`, record });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to update import order status" });
    }
};

// 5. Receive Import Order & Automatically Add Stock to Inventory
exports.receiveImportIntoInventory = async (req, res) => {
    try {
        const record = await ImportCost.findById(req.params.id);
        if (!record) return res.status(404).json({ message: "Import record not found" });

        if (record.receivingStatus === "Received") {
            return res.status(400).json({ message: "This import requisition has already been received into inventory." });
        }

        const qty = Number(record.quantity) || 1;
        const itemName = record.itemName || record.title || "Imported Material";
        const category = record.category || "General";
        const unit = record.unit || "Units";
        const warehouseLocation = record.warehouseLocation || "Central Depot";
        const unitPrice = qty > 0 ? Number((record.totalImportCostBDT / qty).toFixed(2)) : 100;

        // Find existing inventory item or create a new item
        let item = await InventoryItem.findOne({
            itemName: { $regex: new RegExp(`^${itemName.trim()}$`, "i") }
        });

        let previousStock = 0;
        if (item) {
            previousStock = item.currentStock;
            item.currentStock = previousStock + qty;
            item.warehouseLocation = warehouseLocation;
            if (unitPrice > 0) item.unitPrice = unitPrice;
            await item.save();
        } else {
            item = await InventoryItem.create({
                itemCode: generateItemCode(),
                itemName: itemName.trim(),
                category,
                unit,
                currentStock: qty,
                minStockLevel: 10,
                unitPrice: unitPrice > 0 ? unitPrice : 100,
                warehouseLocation
            });
            previousStock = 0;
        }

        // Record stock-in movement
        const movement = await StockMovement.create({
            inventoryItem: item._id,
            movementType: "Stock-In",
            quantity: qty,
            previousStock,
            newStock: item.currentStock,
            referenceNote: `Received Import Requisition: ${record.title} (${record.foreignCurrency} ${record.productCost})`,
            performedBy: req.user._id
        });

        // Mark record as Received and Successfully Closed
        record.receivingStatus = "Received";
        record.orderStatus = "Successfully Closed";
        record.receivedAt = new Date();
        record.receivedBy = req.user._id;
        record.statusUpdatedAt = new Date();
        record.supplierStatusNotes = (record.supplierStatusNotes ? record.supplierStatusNotes + " | " : "") +
            `Material verified & successfully received into ${warehouseLocation} by Logistics (${req.user.name || 'Logistics Officer'}). Import requisition successfully closed.`;
        await record.save();

        res.json({
            message: `🎉 Success! Received ${qty} ${unit} of "${itemName}" into ${warehouseLocation}. Stock updated to ${item.currentStock} ${unit}. Import order marked as "Successfully Closed"!`,
            record,
            item,
            movement
        });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to receive import into inventory" });
    }
};

// 6. Update Import/Export Order Status & Logistics Tracking (Accessible to Supplier, Manager, Admin, Logistics)
exports.updateImportOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            orderStatus,
            carrier,
            trackingNumber,
            estimatedArrival,
            supplierStatusNotes
        } = req.body;

        const record = await ImportCost.findById(id);
        if (!record) return res.status(404).json({ message: "Import record not found" });

        if (orderStatus) record.orderStatus = orderStatus;
        if (carrier !== undefined) record.carrier = carrier;
        if (trackingNumber !== undefined) record.trackingNumber = trackingNumber;
        if (estimatedArrival) record.estimatedArrival = new Date(estimatedArrival);
        if (supplierStatusNotes !== undefined) record.supplierStatusNotes = supplierStatusNotes;

        // Auto-assign supplier details if performed by a supplier
        if (req.user?.role === "supplier") {
            record.assignedSupplier = req.user._id;
            record.supplierName = req.user.name || "Authorized Material Importer";
        }

        record.statusUpdatedAt = new Date();
        await record.save();

        res.json({
            message: `Import order status updated to "${record.orderStatus}" by ${req.user.name || req.user.role}.`,
            record
        });
    } catch (error) {
        res.status(400).json({ message: error.message || "Failed to update import order status" });
    }
};

// 7. Get All Saved Import Calculations / Product Requisitions
exports.getImportRecords = async (req, res) => {
    try {
        const records = await ImportCost.find({})
            .populate("calculatedBy", "name email role")
            .populate("approvedByManager", "name email")
            .populate("approvedByFinance", "name email")
            .populate("receivedBy", "name email")
            .populate("assignedSupplier", "name email")
            .sort({ createdAt: -1 });

        res.json({ records });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

