const PriceAlert = require("./priceAlert.model");
const ScrapedPrice = require("../priceScraper/scrapedPrice.model");

// Catalog of available supplier products for matrix comparison & recommendation
const SAMPLE_PRODUCT_CATALOG = [
    { id: "P1", name: "Akij PCC Cement", category: "Cement", brand: "Akij Cement", supplier: "Akij Building Materials", unitPriceBDT: 560, unit: "Bag", qualityCategory: "Premium", availability: "In Stock", rating: 4.8 },
    { id: "P2", name: "Crown OPC Cement 52.5N", category: "Cement", brand: "Crown Cement", unitPriceBDT: 580, unit: "Bag", supplier: "Crown Polymer Products", qualityCategory: "Premium", availability: "In Stock", rating: 4.9 },
    { id: "P3", name: "Seven Rings Gold PCC", category: "Cement", brand: "Seven Rings", unitPriceBDT: 540, unit: "Bag", supplier: "Shun Shing Group", qualityCategory: "Standard", availability: "In Stock", rating: 4.5 },
    { id: "P4", name: "Fresh PCC Cement", category: "Cement", brand: "Fresh", unitPriceBDT: 520, unit: "Bag", supplier: "Meghna Group", qualityCategory: "Budget", availability: "Limited Stock", rating: 4.3 },

    { id: "P5", name: "BSRM Xtreme 500W Rod", category: "Rod/Steel", brand: "BSRM", unitPriceBDT: 94500, unit: "Ton", supplier: "BSRM Bangladesh", qualityCategory: "Luxury", availability: "In Stock", rating: 4.9 },
    { id: "P6", name: "KSRM 500D Deformed Bar", category: "Rod/Steel", brand: "KSRM", unitPriceBDT: 91000, unit: "Ton", supplier: "Kabir Steel Mills", qualityCategory: "Premium", availability: "In Stock", rating: 4.7 },
    { id: "P7", name: "AKS 500W High Strength Rod", category: "Rod/Steel", brand: "Abul Khair Steel", unitPriceBDT: 89500, unit: "Ton", supplier: "Abul Khair Group", qualityCategory: "Standard", availability: "In Stock", rating: 4.6 },
    { id: "P8", name: "GPH Ispat Quantum Steel", category: "Rod/Steel", brand: "GPH Ispat", unitPriceBDT: 88000, unit: "Ton", supplier: "GPH Group", qualityCategory: "Budget", availability: "In Stock", rating: 4.4 },

    { id: "P9", name: "Mir Machine Made Red Bricks", category: "Bricks", brand: "Mir Ceramic", unitPriceBDT: 14500, unit: "1000 Pcs", supplier: "Mir Group", qualityCategory: "Premium", availability: "In Stock", rating: 4.8 },
    { id: "P10", name: "Standard First Class Auto Bricks", category: "Bricks", brand: "National Bricks", unitPriceBDT: 13200, unit: "1000 Pcs", supplier: "National Kilns", qualityCategory: "Standard", availability: "In Stock", rating: 4.5 },
    { id: "P11", name: "Concrete Solid Blocks", category: "Bricks", brand: "Concord Block", unitPriceBDT: 16000, unit: "1000 Pcs", supplier: "Concord Group", qualityCategory: "Luxury", availability: "In Stock", rating: 4.9 }
];

// 1. Get Product Recommendations based on Budget & Quality Preferences
exports.getRecommendations = async (req, res) => {
    try {
        const { targetBudgetBDT = 500000, preferredQuality = "All", category = "All" } = req.query;
        const budget = Number(targetBudgetBDT) || 500000;

        let catalog = [...SAMPLE_PRODUCT_CATALOG];

        if (category !== "All") {
            catalog = catalog.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (preferredQuality !== "All") {
            catalog = catalog.filter(p => p.qualityCategory.toLowerCase() === preferredQuality.toLowerCase());
        }

        // Sort by value score (rating / unit price)
        catalog.sort((a, b) => (b.rating / b.unitPriceBDT) - (a.rating / a.unitPriceBDT));

        // Package Assembly matching target budget (100 Bags Cement + 3 Tons Rod + 10,000 Bricks)
        const recommendedPackages = [
            {
                packageId: "PKG-BUDGET",
                packageName: "Cost-Optimized Essential Package",
                qualityCategory: "Budget / Standard",
                items: [
                    { product: catalog.find(p => p.category === "Cement" && p.qualityCategory !== "Luxury") || catalog[0], quantity: 150 },
                    { product: catalog.find(p => p.category === "Rod/Steel" && p.qualityCategory !== "Luxury") || catalog[4], quantity: 3 },
                    { product: catalog.find(p => p.category === "Bricks") || catalog[8], quantity: 10 }
                ]
            },
            {
                packageId: "PKG-PREMIUM",
                packageName: "High Performance Structural Package",
                qualityCategory: "Premium / High Yield",
                items: [
                    { product: catalog.find(p => p.category === "Cement" && p.brand === "Crown Cement") || catalog[1], quantity: 150 },
                    { product: catalog.find(p => p.category === "Rod/Steel" && p.brand === "BSRM") || catalog[4], quantity: 3 },
                    { product: catalog.find(p => p.category === "Bricks" && p.brand === "Mir Ceramic") || catalog[8], quantity: 10 }
                ]
            }
        ];

        // Compute package totals and budget match percentage
        const evaluatedPackages = recommendedPackages.map(pkg => {
            let totalBDT = 0;
            const itemBreakdown = pkg.items.map(i => {
                const itemTotal = (i.product?.unitPriceBDT || 0) * i.quantity;
                totalBDT += itemTotal;
                return {
                    name: i.product?.name,
                    brand: i.product?.brand,
                    supplier: i.product?.supplier,
                    unitPriceBDT: i.product?.unitPriceBDT,
                    unit: i.product?.unit,
                    quantity: i.quantity,
                    totalBDT
                };
            });

            const isWithinBudget = totalBDT <= budget;
            const savingsOrExcessBDT = Math.abs(budget - totalBDT);

            return {
                ...pkg,
                totalPackageCostBDT: totalBDT,
                isWithinBudget,
                budgetDeltaBDT: savingsOrExcessBDT,
                statusBadge: isWithinBudget ? "Within Target Budget" : `Exceeds Budget by BDT ${savingsOrExcessBDT}`,
                itemBreakdown
            };
        });

        res.json({
            targetBudgetBDT: budget,
            catalogComparison: catalog,
            recommendedPackages: evaluatedPackages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Subscribe to Price Alert
exports.subscribePriceAlert = async (req, res) => {
    try {
        const { materialName, category, targetMaxPriceBDT } = req.body;

        if (!materialName || !targetMaxPriceBDT) {
            return res.status(400).json({ message: "Material name and target maximum price are required" });
        }

        const alert = await PriceAlert.create({
            materialName,
            category: category || "Cement",
            targetMaxPriceBDT: Number(targetMaxPriceBDT),
            currentMarketPriceBDT: Number(targetMaxPriceBDT) * 1.05, // default slightly above target
            status: "Active",
            user: req.user._id
        });

        res.status(201).json({ message: "Price alert subscription active", alert });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Get Price Alerts & Trigger Evaluation
exports.getPriceAlerts = async (req, res) => {
    try {
        const alerts = await PriceAlert.find({ user: req.user._id }).sort({ createdAt: -1 });
        const scrapedPrices = await ScrapedPrice.find({ verificationStatus: "Verified" });

        // Evaluate triggers against latest market prices
        for (const alert of alerts) {
            const matchedScraped = scrapedPrices.find(s =>
                s.category.toLowerCase() === alert.category.toLowerCase() ||
                s.itemName.toLowerCase().includes(alert.materialName.toLowerCase())
            );

            if (matchedScraped) {
                alert.currentMarketPriceBDT = matchedScraped.priceBDT;
                if (matchedScraped.priceBDT <= alert.targetMaxPriceBDT) {
                    alert.status = "Triggered";
                    alert.alertMessage = `ALERT MATCH: Current price for ${matchedScraped.itemName} (BDT ${matchedScraped.priceBDT}) has dropped below your target budget of BDT ${alert.targetMaxPriceBDT}!`;
                }
                await alert.save();
            }
        }

        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
