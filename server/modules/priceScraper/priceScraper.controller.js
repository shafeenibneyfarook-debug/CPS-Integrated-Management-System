const ScrapedPrice = require("./scrapedPrice.model");
const InventoryItem = require("../inventory/inventory.model");
const { runMaterialPriceScraper } = require("./scraperService");

// Helper function to sync a verified scraped item into Inventory
const syncToInventory = async (record) => {
    if (record.verificationStatus !== "Verified") return;
    try {
        const itemCode = `SCRAP-${record._id.toString().slice(-6).toUpperCase()}`;
        const validCategory = ["Cement & Concrete", "Steel & Rod", "Bricks & Blocks", "Sand & Aggregate", "Tiles & Plumbing", "Electrical & Lighting", "Labour Tools & Equipment", "General"].includes(record.category)
            ? record.category
            : "General";

        await InventoryItem.findOneAndUpdate(
            { itemCode },
            {
                itemCode,
                itemName: `${record.itemName} (${record.brand || record.source})`,
                category: validCategory,
                unit: record.unit || "Pcs",
                currentStock: record.availableQuantity || 100,
                unitPrice: record.priceBDT,
                warehouseLocation: `${record.source || "Market"} Scraped Registry`,
                status: (record.availableQuantity || 100) > 0 ? "In Stock" : "Out of Stock"
            },
            { upsert: true, returnDocument: 'after' }
        );
    } catch (err) {
        console.error("Failed to sync scraped item to inventory:", err);
    }
};

// 1. Run Live Scraper (RESTRICTED SOLELY TO ADMIN)
exports.triggerScraper = async (req, res) => {
    try {
        const triggerUser = req.user ? { userId: req.user._id, role: req.user.role, name: req.user.name } : null;
        const scrapedData = await runMaterialPriceScraper(triggerUser);
        const flaggedCount = scrapedData.filter(d => d.verificationStatus === "Flagged").length;

        // Auto-sync any initial verified items
        for (const item of scrapedData) {
            if (item.verificationStatus === "Verified") {
                await syncToInventory(item);
            }
        }

        res.json({
            message: `Scraper executed successfully by Administrator. Collected ${scrapedData.length} item prices (${flaggedCount} flagged for review).`,
            scrapedItems: scrapedData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Get All Scraped Price Records (Accessible to all authenticated users)
exports.getScrapedPrices = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let filter = {};
        if (category) filter.category = category;
        if (status) filter.verificationStatus = status;

        let prices = await ScrapedPrice.find(filter).sort({ scrapedDate: -1 });

        if (search) {
            const query = search.toLowerCase();
            prices = prices.filter(p =>
                p.itemName.toLowerCase().includes(query) ||
                p.brand.toLowerCase().includes(query) ||
                p.source.toLowerCase().includes(query)
            );
        }

        res.json({ prices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Review & Action on Flagged / Pending Price (Restricted to Admin & Supplier)
exports.reviewPriceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationStatus, priceBDT, notes } = req.body;

        const record = await ScrapedPrice.findById(id);
        if (!record) return res.status(404).json({ message: "Scraped price record not found" });

        if (verificationStatus) record.verificationStatus = verificationStatus;
        if (priceBDT !== undefined && !isNaN(priceBDT)) {
            record.priceBDT = Number(priceBDT);
        }
        if (notes) record.flagReason = notes;

        record.reviewedBy = req.user._id;
        record.reviewedAt = new Date();

        await record.save();

        // AUTO-SYNC TO INVENTORY IF VERIFIED
        if (record.verificationStatus === "Verified") {
            await syncToInventory(record);
        }

        res.json({ message: `Price record updated to "${record.verificationStatus}" by ${req.user.role}. Synced with Inventory.`, record });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 4. Supplier Submits Available Material Quantity (Supplier Role)
exports.submitSupplierQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { availableQuantity, supplierNotes } = req.body;

        const record = await ScrapedPrice.findById(id);
        if (!record) return res.status(404).json({ message: "Material record not found" });

        if (record.verificationStatus !== "Verified") {
            return res.status(400).json({ message: "Suppliers can only add quantities for Verified material items." });
        }

        record.availableQuantity = Number(availableQuantity) || 0;
        record.supplierNotes = supplierNotes || "";
        record.supplierUser = req.user._id;
        record.supplierName = req.user.name || "Material Vendor";
        record.quantityVerificationStatus = "Pending Verification";

        await record.save();
        res.json({ message: `Supplier quantity offer (${availableQuantity} ${record.unit}) submitted for Logistics Officer verification.`, record });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 5. Logistics / Operations Officer Verifies Supplier Quantity (Operations Officer Role)
exports.verifyLogisticsQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // "Logistics Verified" or "Rejected"

        const record = await ScrapedPrice.findById(id);
        if (!record) return res.status(404).json({ message: "Material record not found" });

        record.quantityVerificationStatus = status || "Logistics Verified";
        record.quantityVerifiedBy = req.user._id;
        record.quantityVerifiedAt = new Date();

        await record.save();

        // SYNC CONFIRMED LOGISTICS QUANTITY TO INVENTORY
        if (record.verificationStatus === "Verified") {
            await syncToInventory(record);
        }

        res.json({ message: `Supplier quantity marked as ${record.quantityVerificationStatus} by Operations Logistics Officer`, record });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 6. Delete Duplicate / Invalid Scraped Price Record (Restricted to Admin Only)
exports.deletePriceRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await ScrapedPrice.findByIdAndDelete(id);
        if (!record) return res.status(404).json({ message: "Scraped price record not found" });

        res.json({ message: `Scraped price entry (${record.itemName}) deleted successfully by Admin`, id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
