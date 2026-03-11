const { createApp, ref, onMounted, computed } = Vue;

const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=7&page=1&sparkline=false&price_change_percentage=24h";
const GLOBAL_URL = "https://api.coingecko.com/api/v3/global";

createApp({
    setup() {
        const loading = ref(false);
        const searchQuery = ref("");
        const activeMenu = ref("Dashboard");
        const performanceStatus = ref("Market Live");
        const marketData = ref([]);
        const chartType = ref("bar");
        const mxnRate = ref(17.00); // Fallback rate
        
        const converter = ref({
            amount: 1,
            coinPrice: 0,
            result: 0
        });
        
        // --- THEMES ---
        const currentTheme = ref(localStorage.getItem('visionary-theme') || 'dark');
        const themes = ref([
            { id: 'dark', name: 'Visionary Dark', color: '#00d2ff' },
            { id: 'light', name: 'Arctic Light', color: '#3b82f6' },
            { id: 'orange', name: 'Sunset Orange', color: '#ff8c00' }
        ]);

        const setTheme = (themeId) => {
            currentTheme.value = themeId;
            localStorage.setItem('visionary-theme', themeId);
            document.body.className = `theme-${themeId}`;
        };

        const setChartType = (type) => {
            chartType.value = type;
            initChart();
            updateDashboard();
        };

        const stats = ref([
            { label: "Market Cap (TRI)", value: 0, trend: 0, icon: "🌎", class: "revenue" },
            { label: "24h Volume (BN)", value: 0, trend: 0, icon: "📊", class: "users" },
            { label: "BTC Dominance", value: 0, trend: 0, icon: "₿", class: "tasks" },
            { label: "Active Cryptos", value: 0, trend: 0, icon: "🪙", class: "sessions" }
        ]);

        const menuItems = ref([
            { name: "Dashboard", icon: "📊" },
            { name: "Exchange", icon: "💱" },
            { name: "Portfolio", icon: "💼" },
            { name: "Settings", icon: "⚙️" }
        ]);

        let chart = null;

        const filteredActivity = computed(() => {
            if (!searchQuery.value) return marketData.value;
            const q = searchQuery.value.toLowerCase();
            return marketData.value.filter(a => 
                a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
            );
        });

        const formatCurrency = (val, currency = 'USD') => {
            return new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: currency, 
                minimumFractionDigits: currency === 'USD' ? 0 : 2 
            }).format(val);
        };

        const updateDashboard = async () => {
            loading.value = true;
            try {
                // Fetch Prices, Global Info & Exchange Rate (BTC in USD vs MXN)
                const [pricesRes, globalRes, ratesRes] = await Promise.all([
                    fetch(COINGECKO_URL),
                    fetch(GLOBAL_URL),
                    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,mxn")
                ]);
                
                const prices = await pricesRes.json();
                const global = await globalRes.json();
                const rates = await ratesRes.json();
                const gData = global.data;

                marketData.value = prices;
                
                // Derive USD/MXN rate from BTC prices
                if (rates.bitcoin) {
                    mxnRate.value = rates.bitcoin.mxn / rates.bitcoin.usd;
                }

                // Update Stats
                stats.value[0].value = (gData.total_market_cap.usd / 1e12).toFixed(2);
                stats.value[1].value = (gData.total_volume.usd / 1e9).toFixed(2);
                stats.value[2].value = gData.market_cap_percentage.btc.toFixed(1);
                stats.value[3].value = gData.active_cryptocurrencies;

                if (chart) {
                    chart.data.labels = prices.map(c => c.symbol.toUpperCase());
                    chart.data.datasets[0].data = prices.map(c => c.current_price);
                    chart.data.datasets[0].label = 'Price (USD)';
                    chart.update();
                }
                
                performanceStatus.value = gData.market_cap_change_percentage_24h_usd >= 0 ? "Bullish" : "Bearish";

                // Update converter default to BTC if not set
                if (converter.value.coinPrice === 0 && prices.length > 0) {
                    converter.value.coinPrice = prices[0].current_price;
                }

            } catch (e) {
                console.warn("Market Sync Error:", e);
            } finally {
                loading.value = false;
            }
        };

        const initChart = () => {
            const canvas = document.getElementById('performanceChart');
            if (!canvas) return;
            if (chart) chart.destroy();

            const ctx = canvas.getContext('2d');
            const type = chartType.value;
            let bg = 'rgba(0, 210, 255, 0.2)';
            let border = '#00d2ff';
            
            if (type === 'line') {
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(0, 210, 255, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');
                bg = gradient;
            } else if (type === 'pie') {
                bg = ['#f7931a', '#627eea', '#26a17b', '#f3ba2f', '#345d9d', '#e84142', '#00d2ff'];
                border = 'transparent';
            }

            chart = new Chart(ctx, {
                type: type,
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: border,
                        backgroundColor: bg,
                        fill: type === 'line',
                        tension: 0.4,
                        borderWidth: type === 'pie' ? 0 : 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: type === 'pie', position: 'bottom', labels: { color: '#94a3b8' } } 
                    },
                    scales: {
                        y: { display: type !== 'pie', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        x: { display: type !== 'pie', grid: { display: false }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        };

        onMounted(() => {
            setTheme(currentTheme.value);
            initChart();
            updateDashboard();
            setInterval(updateDashboard, 60000); // 1 min sync for professional feel
        });

        return {
            loading, searchQuery, activeMenu, stats, 
            menuItems, filteredActivity, formatCurrency, 
            syncData: updateDashboard, performanceStatus,
            currentTheme, themes, setTheme,
            chartType, setChartType,
            mxnRate, converter
        };
    }
}).mount('#app');
