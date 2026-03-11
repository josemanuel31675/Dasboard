// Forzar carga limpia de Vue
const { createApp, ref, onMounted, computed } = Vue;

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcKxPLUm13QWQBV9sOaymcUOhwrb6F350CEgikiolcIxAp2k4rEjj2GmYwN8lPpAEa/exec";

createApp({
    setup() {
        const loading = ref(false);
        const searchQuery = ref("");
        const activeMenu = ref("Dashboard");
        const performanceStatus = ref("Excellent");
        const activity = ref([]);
        const chartType = ref("line");
        
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
            initChart(); // Re-initialize with new type
            syncData();  // Refresh data for the new visual
        };

        const stats = ref([
            { label: "Total Page Visits", value: 0, trend: 12.5, icon: "💰", class: "revenue" },
            { label: "Total Questions", value: 0, trend: 5.2, icon: "👥", class: "users" },
            { label: "Unanswered", value: 0, trend: -1.4, icon: "🎯", class: "tasks" },
            { label: "Avg. Session", value: 12.7, trend: 2.1, icon: "⏱️", class: "sessions" }
        ]);

        const menuItems = ref([
            { name: "Dashboard", icon: "📊" },
            { name: "Analytics", icon: "📈" },
            { name: "Chat Logs", icon: "💬" },
            { name: "Settings", icon: "⚙️" }
        ]);

        let chart = null;

        const filteredActivity = computed(() => {
            if (!searchQuery.value) return activity.value;
            const q = searchQuery.value.toLowerCase();
            return activity.value.filter(a => 
                (a.content && a.content.toLowerCase().includes(q)) || 
                a.type.toLowerCase().includes(q)
            );
        });

        const formatTime = (dateStr) => {
            if (!dateStr) return "Just now";
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const syncData = async () => {
            loading.value = true;
            try {
                const res = await fetch(`${GOOGLE_SCRIPT_URL}?cb=${Date.now()}`);
                const data = await res.json();
                
                // Protección contra datos nulos o malformados
                const currentStats = data.stats || { visits: 0, questions: 0, unanswered: 0 };
                
                stats.value[0].value = currentStats.visits || 0;
                stats.value[1].value = currentStats.questions || 0;
                stats.value[2].value = currentStats.unanswered || 0;
                activity.value = data.activity || [];

                if (chart) {
                    const totalV = currentStats.visits || 100;
                    const base = totalV / 10;
                    const newData = Array.from({length: 7}, () => Math.floor(base + Math.random() * base));
                    
                    chart.data.datasets[0].data = newData;
                    chart.update();
                }
            } catch (e) {
                console.warn("Dashboard Sync (Silent Fallback):", e);
            } finally {
                loading.value = false;
            }
        };

        const initChart = () => {
            const canvas = document.getElementById('performanceChart');
            if (!canvas) return;
            
            // Destroy existing chart to change type
            if (chart) chart.destroy();

            const ctx = canvas.getContext('2d');
            const type = chartType.value;
            
            // Styliing based on type
            let bg = 'rgba(0, 210, 255, 0.2)';
            let border = '#00d2ff';
            
            if (type === 'line') {
                const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                gradient.addColorStop(0, 'rgba(0, 210, 255, 0.5)');
                gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');
                bg = gradient;
            } else if (type === 'pie') {
                bg = ['#00d2ff', '#9d50bb', '#ff8c00', '#10b981', '#ef4444', '#6366f1', '#f59e0b'];
                border = 'transparent';
            }

            chart = new Chart(ctx, {
                type: type,
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Visits',
                        data: [65, 80, 70, 95, 85, 110, 130],
                        borderColor: border,
                        backgroundColor: bg,
                        fill: type === 'line',
                        tension: 0.4,
                        borderWidth: type === 'pie' ? 0 : 3,
                        pointRadius: 0
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
            syncData();
            setInterval(syncData, 300000); // 5 mins sync
        });

        return {
            loading, searchQuery, activeMenu, stats, 
            menuItems, filteredActivity, formatTime, 
            syncData, performanceStatus,
            currentTheme, themes, setTheme,
            chartType, setChartType
        };
    }
}).mount('#app');
