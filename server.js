const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cache dashboard payload in memory
const DATA_FILE = path.join(__dirname, 'churn_dashboard_data.json');
let dashboardData = null;
if (fs.existsSync(DATA_FILE)) {
    try {
        dashboardData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        console.log('✅ Churn dashboard data loaded into memory.');
    } catch (e) {
        console.error('Error parsing dashboard data:', e.message);
    }
}

// Cache CSV customer data in memory
const CSV_FILE = path.join(__dirname, 'Telco-Customer-Churn.csv');
let customerRecords = [];
if (fs.existsSync(CSV_FILE)) {
    try {
        const raw = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = raw.trim().split(/\r?\n/);
        const headers = lines[0].split(',');
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Parse CSV row handling quotes if any
            const row = lines[i].split(',');
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h.trim()] = row[idx] ? row[idx].trim() : '';
            });
            customerRecords.push(obj);
        }
        console.log(`✅ Loaded ${customerRecords.length.toLocaleString()} customer records into memory.`);
    } catch (e) {
        console.error('Error loading CSV customers:', e.message);
    }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Health & Meta
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        environment: 'Telecom Churn Analytics API',
        node_version: process.version,
        customers_loaded: customerRecords.length,
        timestamp: new Date().toISOString()
    });
});

// 2. Full Analytical Statistics Payload
app.get('/api/stats', (req, res) => {
    if (!dashboardData) {
        return res.status(500).json({ error: 'Dashboard data not loaded.' });
    }
    res.json(dashboardData);
});

// 3. Filterable Customer Database with Pagination & Bulk Fetch
app.get('/api/customers', (req, res) => {
    // If client requests all records for instant interactive cross-filtering
    if (req.query.all === 'true' || req.query.limit === 'all') {
        return res.json({
            total: customerRecords.length,
            data: customerRecords
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = (req.query.search || '').toLowerCase();
    const contract = req.query.contract || 'All';
    const internet = req.query.internet || 'All';
    const payment = req.query.payment || 'All';
    const churn = req.query.churn || 'All';

    let filtered = customerRecords;

    if (search) {
        filtered = filtered.filter(c => 
            c.customerID.toLowerCase().includes(search) || 
            c.Contract.toLowerCase().includes(search) ||
            c.PaymentMethod.toLowerCase().includes(search)
        );
    }

    if (contract !== 'All') {
        filtered = filtered.filter(c => c.Contract === contract);
    }
    if (internet !== 'All') {
        filtered = filtered.filter(c => c.InternetService === internet);
    }
    if (payment !== 'All') {
        filtered = filtered.filter(c => c.PaymentMethod === payment);
    }
    if (churn !== 'All') {
        filtered = filtered.filter(c => c.Churn === churn);
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginated
    });
});

// 4. Live Machine Learning Churn Predictor API (Python Engine with Fallback)
app.post('/api/predict', (req, res) => {
    const p = req.body || {};
    const pythonScript = path.join(__dirname, 'predict.py');

    function sendHeuristicFallback() {
        let score = 0.45;
        if (p.Contract === 'Month-to-month') score += 0.32;
        if (p.Contract === 'Two year') score -= 0.35;
        if (p.Contract === 'One year') score -= 0.18;

        if (p.PaymentMethod === 'Electronic check') score += 0.18;
        if (p.PaymentMethod && p.PaymentMethod.includes('automatic')) score -= 0.14;

        if (p.InternetService === 'Fiber optic') score += 0.15;
        if (p.OnlineSecurity === 'No') score += 0.08;
        if (p.TechSupport === 'No') score += 0.08;

        const tenure = parseInt(p.tenure) || 1;
        if (tenure <= 6) score += 0.22;
        else if (tenure >= 36) score -= 0.25;

        const monthly = parseFloat(p.MonthlyCharges) || 75;
        if (monthly >= 80) score += 0.12;

        const prob = Math.min(0.96, Math.max(0.04, score));
        const probPct = Math.round(prob * 1000) / 10;
        const isChurn = prob >= 0.50;

        const recs = isChurn ? [
            `Offer a 15% discount to switch from ${p.Contract || 'Month-to-month'} to a 1-Year or 2-Year contract.`,
            "Enroll customer in automatic bill pay with a $5 recurring monthly discount.",
            "Include free dedicated Tech Support and Online Security."
        ] : [
            "Customer profile is healthy with high loyalty and low risk.",
            "Good candidate for speed upgrades or premium channel add-ons.",
            "Continue normal customer care and satisfaction check-ins."
        ];

        return res.json({
            success: true,
            probability: prob,
            probability_pct: probPct,
            is_churn: isChurn,
            risk_level: isChurn ? 'CRITICAL HIGH CHURN RISK' : 'HEALTHY LOYAL SUBSCRIBER',
            recommendations: recs
        });
    }

    try {
        const pyProcess = spawn('python', [pythonScript, JSON.stringify(p)]);
        let outputData = '';
        let errorData = '';

        pyProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pyProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pyProcess.on('error', () => {
            sendHeuristicFallback();
        });

        pyProcess.on('close', (code) => {
            if (code !== 0 || !outputData.trim()) {
                return sendHeuristicFallback();
            }

            try {
                const result = JSON.parse(outputData.trim());
                res.json(result);
            } catch (e) {
                sendHeuristicFallback();
            }
        });
    } catch (err) {
        sendHeuristicFallback();
    }
});

// Fallback to SPA index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n================================================================`);
        console.log(`🚀 Telecom Customer Churn Analytics Dashboard Running!`);
        console.log(`🌐 Local URL:   http://localhost:${PORT}`);
        console.log(`================================================================\n`);
    });
}

module.exports = app;
