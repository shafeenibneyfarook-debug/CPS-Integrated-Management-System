const BoqEstimate = require("./boqEstimate.model");
const ScrapedPrice = require("../priceScraper/scrapedPrice.model");
const { generateGroqCompletion } = require("../../config/groqService");

// Helper to fetch latest verified prices or default baseline
const getLatestPrices = async () => {
    const verifiedPrices = await ScrapedPrice.find({ verificationStatus: "Verified" });
    const priceMap = {
        cement: 560,
        rod: 94000,
        bricks: 14500,
        sand: 58,
        labour: 950
    };

    verifiedPrices.forEach(p => {
        if (p.category === "Cement" && p.priceBDT > 0) priceMap.cement = p.priceBDT;
        if (p.category === "Rod/Steel" && p.priceBDT > 0) priceMap.rod = p.priceBDT;
        if (p.category === "Bricks" && p.priceBDT > 0) priceMap.bricks = p.priceBDT;
        if (p.category === "Sand & Aggregate" && p.priceBDT > 0) priceMap.sand = p.priceBDT;
        if (p.category === "Labour" && p.priceBDT > 0) priceMap.labour = p.priceBDT;
    });

    return priceMap;
};

// AI Bangladesh Construction Context & Reasoning Generator
const generateAiBangladeshContext = async ({ projectType, totalAreaSqFt, floors, region = "Dhaka", prices }) => {
    const isCoastal = region === "Chittagong" || region === "Khulna";
    const aiNotes = [];

    // Structural & BNBC Code AI Recommendation based on height
    if (floors >= 6) {
        aiNotes.push(`• BNBC Deep Foundation Standard: High-rise structure (${floors} stories, ${totalAreaSqFt.toLocaleString()} sq ft) requires RCC cast-in-situ piling (120ft-150ft depth), shear wall core, and dual moment-resisting frame per BNBC 2020.`);
    } else if (floors >= 3) {
        aiNotes.push(`• BNBC Raft / Mat Foundation Standard: Mid-rise structure (${floors} stories) engineered for continuous mat foundation or combined footings with high-yield 500W TMT rebar.`);
    } else {
        aiNotes.push(`• BNBC Shallow Foundation Standard: Low-rise structure (${floors} stories) engineered with reinforced isolated column footings and Grade-60 / 500W rebar.`);
    }

    // Regional & Environmental AI Factor
    if (isCoastal) {
        aiNotes.push(`• Coastal Salinity AI Warning (${region}): Structural steel requires anti-corrosive epoxy coating or 500W BSRM/Xtreme rebar with minimum 75mm concrete cover due to saline coastal atmosphere.`);
    } else if (region === "Sylhet") {
        aiNotes.push(`• High Seismic Zone 4 AI Detailing (Sylhet): Design incorporates 135° seismic beam-column tie hooks and higher stirrup density. Direct access to Sylhet FM 2.5 coarse sand optimizes aggregate cost by ~12%.`);
    } else if (region === "Dhaka") {
        aiNotes.push(`• Capital Logistics & Materials (Dhaka / Central): Concrete casting scheduled with night heavy vehicle transit permits (10:00 PM - 6:00 AM). Mirpur First-Class gas-burnt bricks and Sylhet sand index applied.`);
    } else {
        aiNotes.push(`• Regional Geological Factor (${region}): Regional soil bearing capacity applied with temperature expansion joints for seasonal thermal variance.`);
    }

    // Material Market Price AI Intelligence
    aiNotes.push(`• Current Verified Bangladesh Price Baseline: Cement: BDT ${prices.cement}/bag, Steel Rod (500W): BDT ${prices.rod.toLocaleString()}/Ton, Mirpur Bricks: BDT ${prices.bricks.toLocaleString()}/k pcs, Sylhet Sand: BDT ${prices.sand}/CFT, Labour: BDT ${prices.labour}/day.`);

    // Groq AI Structural Intelligence
    const groqPrompt = `You are a chief structural engineer in Bangladesh complying with BNBC 2020. 
Analyze a ${floors}-floor ${projectType} with ${totalAreaSqFt} total sq ft in ${region}, Bangladesh.
Current market prices: Cement BDT ${prices.cement}/bag, Steel Rod BDT ${prices.rod}/Ton, Bricks BDT ${prices.bricks}/k, Sand BDT ${prices.sand}/CFT.
Give exactly 2 concise, highly technical bullet points explaining:
1. Structural foundation & seismic/wind load considerations for this height and region.
2. Best material brands (e.g. BSRM, Akij, Scan) and concrete mix grade recommendations.`;

    const groqInsight = await generateGroqCompletion(groqPrompt);

    if (groqInsight) {
        const cleanInsight = groqInsight.replace(/\r?\n+/g, " ").trim();
        aiNotes.push(`• Groq AI Structural Intelligence (Llama-3.3 70B): ${cleanInsight}`);
    }

    return {
        aiEngine: process.env.GROQ_API_KEY ? "Groq AI (Llama-3.3 70B) + BNBC Structural Modeling Engine v3.0" : "BNBC 2020 Structural Modeling Engine v3.0",
        bnbcCodeCompliance: "BNBC 2020 / PWD Bangladesh Standard Compliant",
        region,
        aiNotes
    };
};

// 1. Calculate Deterministic, Context-Aware BOQ Cost Estimate with 3 Distinct Plans
exports.calculateEstimate = async (req, res) => {
    try {
        const {
            estimateName = "New BOQ Estimate",
            projectType = "Residential Building",
            approximateAreaSqFt = 1000,
            numberOfFloors = 1,
            region = "Dhaka",
            materialQuality = "Standard",
            labourCategory = "Standard"
        } = req.body;

        const area = Number(approximateAreaSqFt) || 1000;
        const floors = Number(numberOfFloors) || 1;
        const totalAreaSqFt = area * floors;

        // Base price map from verified scraped data
        const prices = await getLatestPrices();

        // 1. Base Quantities per 1,000 sq ft based on Project Type Context
        let baseCementPer1k = 390;
        let baseSteelPer1k = 3.6;
        let baseBricksPer1k = 12000;
        let baseSandPer1k = 1800;
        let baseLabourPer1k = 240;

        if (projectType.includes("Commercial")) {
            baseCementPer1k = 470;
            baseSteelPer1k = 4.9;
            baseBricksPer1k = 10500;
            baseSandPer1k = 2100;
            baseLabourPer1k = 290;
        } else if (projectType.includes("Industrial") || projectType.includes("Warehouse")) {
            baseCementPer1k = 450;
            baseSteelPer1k = 5.4;
            baseBricksPer1k = 8500;
            baseSandPer1k = 2300;
            baseLabourPer1k = 270;
        } else if (projectType.includes("Renovation") || projectType.includes("Extension")) {
            baseCementPer1k = 320;
            baseSteelPer1k = 2.8;
            baseBricksPer1k = 9000;
            baseSandPer1k = 1400;
            baseLabourPer1k = 250;
        }

        // 2. Structural & Foundation Load Factor based on Floor Count (Height)
        let heightStructuralFactor = 1.00;
        if (floors >= 11) {
            heightStructuralFactor = 1.45; // High-rise deep piling, shear walls, wind bracing
        } else if (floors >= 6) {
            heightStructuralFactor = 1.28; // Deep piling + pile cap + seismic shear walls
        } else if (floors >= 3) {
            heightStructuralFactor = 1.12; // Mat/raft foundation + larger column load
        }

        // 3. Regional Environmental / Geological Factor
        let regionalSteelFactor = 1.00;
        let regionalSandFactor = 1.00;
        let regionalLogisticsFactor = 1.00;

        if (region === "Chittagong" || region === "Khulna") {
            regionalSteelFactor = 1.06; // Extra concrete cover & anti-corrosive coating
        } else if (region === "Sylhet") {
            regionalSteelFactor = 1.07; // Seismic Zone 4 confining ties
            regionalSandFactor = 0.90; // Local Sylhet sand proximity discount
        } else if (region === "Dhaka") {
            regionalLogisticsFactor = 1.03; // Night logistics & urban handling
        }

        // Compute total engineering material quantities
        const areaFactor = totalAreaSqFt / 1000;
        const totalCementBags = Math.round(baseCementPer1k * areaFactor * heightStructuralFactor);
        const totalSteelTons = Number((baseSteelPer1k * areaFactor * heightStructuralFactor * regionalSteelFactor).toFixed(2));
        const totalBricksPcs = Math.round(baseBricksPer1k * areaFactor);
        const totalSandCft = Math.round(baseSandPer1k * areaFactor * heightStructuralFactor * regionalSandFactor);
        const totalLabourDays = Math.round(baseLabourPer1k * areaFactor * heightStructuralFactor * regionalLogisticsFactor);

        // 4. Generate 3 Distinct Engineering Plans (Non-random, technically specified)
        
        // --- PLAN 1: LOW BUDGET / ECONOMY TIER ---
        // Specifications: 1:2:4 Concrete, 400W/Grade 60 Steel, Standard Clay Bricks, 12% Finishing
        const lowUnitCement = Math.round(prices.cement * 0.94);
        const lowUnitSteel = Math.round(prices.rod * 0.92);
        const lowUnitBricks = Math.round(prices.bricks * 0.90);
        const lowUnitSand = Math.round(prices.sand * 0.92);
        const lowUnitLabour = Math.round(prices.labour * 0.92);

        const lowCementCost = Math.round(totalCementBags * lowUnitCement);
        const lowSteelCost = Math.round(totalSteelTons * lowUnitSteel);
        const lowBricksCost = Math.round((totalBricksPcs / 1000) * lowUnitBricks);
        const lowSandCost = Math.round(totalSandCft * lowUnitSand);
        const lowMatSubtotal = lowCementCost + lowSteelCost + lowBricksCost + lowSandCost;
        const lowLabourCost = Math.round(totalLabourDays * lowUnitLabour);
        const lowFinishing = Math.round(lowMatSubtotal * 0.12);
        const lowTotal = lowMatSubtotal + lowLabourCost + lowFinishing;

        const lowPlan = {
            tierName: "Low Budget Plan",
            qualityGrade: "Economy Grade (1:2:4 Concrete, 400W/Grade-60 Rebar, Standard Bricks)",
            specs: {
                concreteMix: "1:2:4 (M15-M20 equivalent)",
                rebarGrade: "400W / Grade 60 TMT Deformed Rebar",
                cementType: "Portland Composite Cement (Standard PCC)",
                masonry: "Standard Auto-Machine Burnt Clay Bricks",
                finishingAllowance: "12% essential electrical, plumbing & local tiles"
            },
            totalCostBDT: lowTotal,
            estimatedCostPerSqFt: Math.round(lowTotal / totalAreaSqFt),
            materialBreakdown: {
                cement: { quantity: totalCementBags, unit: "Bags", unitPriceBDT: lowUnitCement, totalBDT: lowCementCost },
                rod: { quantity: totalSteelTons, unit: "Tons", unitPriceBDT: lowUnitSteel, totalBDT: lowSteelCost },
                bricks: { quantity: totalBricksPcs, unit: "Pcs", unitPriceBDT: lowUnitBricks, totalBDT: lowBricksCost },
                sand: { quantity: totalSandCft, unit: "CFT", unitPriceBDT: lowUnitSand, totalBDT: lowSandCost },
                subtotalMaterialBDT: lowMatSubtotal
            },
            labourBreakdown: {
                manDays: totalLabourDays,
                ratePerDayBDT: lowUnitLabour,
                subtotalLabourBDT: lowLabourCost
            },
            finishingAndOverheadsBDT: lowFinishing
        };

        // --- PLAN 2: STANDARD / RECOMMENDED TIER (BNBC 2020 High-Performance) ---
        // Specifications: 1:1.5:3 Concrete (M25), 500W BSRM/AKS Steel, Mirpur 1st Class Bricks, 18% Full MEP
        const stdUnitCement = prices.cement;
        const stdUnitSteel = prices.rod;
        const stdUnitBricks = prices.bricks;
        const stdUnitSand = prices.sand;
        const stdUnitLabour = prices.labour;

        const stdCementCost = Math.round(totalCementBags * stdUnitCement);
        const stdSteelCost = Math.round(totalSteelTons * stdUnitSteel);
        const stdBricksCost = Math.round((totalBricksPcs / 1000) * stdUnitBricks);
        const stdSandCost = Math.round(totalSandCft * stdUnitSand);
        const stdMatSubtotal = stdCementCost + stdSteelCost + stdBricksCost + stdSandCost;
        const stdLabourCost = Math.round(totalLabourDays * stdUnitLabour);
        const stdFinishing = Math.round(stdMatSubtotal * 0.18);
        const stdTotal = stdMatSubtotal + stdLabourCost + stdFinishing;

        const standardPlan = {
            tierName: "Standard Budget Plan (Recommended)",
            qualityGrade: "BNBC 2020 Standard (1:1.5:3 M25 Concrete, 500W BSRM/AKS, Mirpur Grade-1 Bricks)",
            specs: {
                concreteMix: "1:1.5:3 (M25 Structural Strength with Water-Reducer)",
                rebarGrade: "500W High-Yield TMT Rebar (BSRM / AKS / Rahim Steel)",
                cementType: "High-Strength PCC (Akij / Scan / Shah / Seven Rings)",
                masonry: "Mirpur First-Class Gas-Burnt Solid Clay Bricks",
                finishingAllowance: "18% complete MEP, CPVC piping, vitrified tiles & fire-safe wiring"
            },
            totalCostBDT: stdTotal,
            estimatedCostPerSqFt: Math.round(stdTotal / totalAreaSqFt),
            materialBreakdown: {
                cement: { quantity: totalCementBags, unit: "Bags", unitPriceBDT: stdUnitCement, totalBDT: stdCementCost },
                rod: { quantity: totalSteelTons, unit: "Tons", unitPriceBDT: stdUnitSteel, totalBDT: stdSteelCost },
                bricks: { quantity: totalBricksPcs, unit: "Pcs", unitPriceBDT: stdUnitBricks, totalBDT: stdBricksCost },
                sand: { quantity: totalSandCft, unit: "CFT", unitPriceBDT: stdUnitSand, totalBDT: stdSandCost },
                subtotalMaterialBDT: stdMatSubtotal
            },
            labourBreakdown: {
                manDays: totalLabourDays,
                ratePerDayBDT: stdUnitLabour,
                subtotalLabourBDT: stdLabourCost
            },
            finishingAndOverheadsBDT: stdFinishing
        };

        // --- PLAN 3: PREMIUM / ARCHITECTURAL TIER ---
        // Specifications: High-Strength M30/M35 Concrete with Silica Fume, 500D/550W Rebar, Clinker Bricks, 28% Luxury MEP
        const premUnitCement = Math.round(prices.cement * 1.15);
        const premUnitSteel = Math.round(prices.rod * 1.12);
        const premUnitBricks = Math.round(prices.bricks * 1.25);
        const premUnitSand = Math.round(prices.sand * 1.18);
        const premUnitLabour = Math.round(prices.labour * 1.20);

        const premCementCost = Math.round(totalCementBags * premUnitCement);
        const premSteelCost = Math.round(totalSteelTons * premUnitSteel);
        const premBricksCost = Math.round((totalBricksPcs / 1000) * premUnitBricks);
        const premSandCost = Math.round(totalSandCft * premUnitSand);
        const premMatSubtotal = premCementCost + premSteelCost + premBricksCost + premSandCost;
        const premLabourCost = Math.round(totalLabourDays * premUnitLabour);
        const premFinishing = Math.round(premMatSubtotal * 0.28);
        const premTotal = premMatSubtotal + premLabourCost + premFinishing;

        const premiumPlan = {
            tierName: "Premium Budget Plan",
            qualityGrade: "Architectural Luxury Grade (M30/M35 Ready-Mix, 500D/550W Ultima Rebar, Acoustic Block)",
            specs: {
                concreteMix: "M30/M35 Ready-Mix with Silica Fume & Superplasticizer",
                rebarGrade: "500D / 550W Seismic-Grade Corrosion-Inhibiting Epoxy Steel",
                cementType: "Ordinary Portland Cement (OPC Grade 53) / Imported Rapid Hardening",
                masonry: "Clinker Engineering Bricks / Acoustic-Insulated Concrete Hollow Blocks",
                finishingAllowance: "28% luxury architectural MEP, imported sanitaryware & smart automation"
            },
            totalCostBDT: premTotal,
            estimatedCostPerSqFt: Math.round(premTotal / totalAreaSqFt),
            materialBreakdown: {
                cement: { quantity: totalCementBags, unit: "Bags", unitPriceBDT: premUnitCement, totalBDT: premCementCost },
                rod: { quantity: totalSteelTons, unit: "Tons", unitPriceBDT: premUnitSteel, totalBDT: premSteelCost },
                bricks: { quantity: totalBricksPcs, unit: "Pcs", unitPriceBDT: premUnitBricks, totalBDT: premBricksCost },
                sand: { quantity: totalSandCft, unit: "CFT", unitPriceBDT: premUnitSand, totalBDT: premSandCost },
                subtotalMaterialBDT: premMatSubtotal
            },
            labourBreakdown: {
                manDays: totalLabourDays,
                ratePerDayBDT: premUnitLabour,
                subtotalLabourBDT: premLabourCost
            },
            finishingAndOverheadsBDT: premFinishing
        };

        // Generate AI Bangladesh Context & Structural Analysis
        const aiContext = await generateAiBangladeshContext({ projectType, totalAreaSqFt, floors, region, prices });

        const result = {
            estimateName,
            projectType,
            region,
            approximateAreaSqFt: area,
            numberOfFloors: floors,
            totalBuiltupAreaSqFt: totalAreaSqFt,
            inputQuality: materialQuality,
            inputLabour: labourCategory,
            aiContext,
            summary: {
                lowBudgetTotalBDT: lowPlan.totalCostBDT,
                standardBudgetTotalBDT: standardPlan.totalCostBDT,
                premiumBudgetTotalBDT: premiumPlan.totalCostBDT
            },
            options: {
                low: lowPlan,
                standard: standardPlan,
                premium: premiumPlan
            }
        };

        res.json(result);
    } catch (error) {
        console.error("BOQ Estimation Calculation Error:", error);
        res.status(400).json({ message: error.message });
    }
};

// 2. Save BOQ Estimate
exports.saveEstimate = async (req, res) => {
    try {
        const { estimateName, projectType, approximateAreaSqFt, numberOfFloors, region, materialQuality, labourCategory, options, summary } = req.body;

        const estimate = await BoqEstimate.create({
            estimateName: estimateName || "Project BOQ Estimate",
            client: req.user._id,
            projectType,
            approximateAreaSqFt,
            numberOfFloors,
            materialQuality,
            labourCategory,
            lowBudgetTotalBDT: summary.lowBudgetTotalBDT,
            standardBudgetTotalBDT: summary.standardBudgetTotalBDT,
            premiumBudgetTotalBDT: summary.premiumBudgetTotalBDT,
            breakdownOptions: options,
            createdBy: req.user._id
        });

        res.status(201).json({ message: "BOQ Estimate saved successfully", estimate });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Get Saved BOQ Estimates
exports.getEstimates = async (req, res) => {
    try {
        const query = req.user.role === "client" ? { createdBy: req.user._id } : {};

        const estimates = await BoqEstimate.find(query)
            .populate("client", "companyName name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.json({ estimates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
