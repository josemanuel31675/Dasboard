const { createApp, ref, onMounted, computed } = Vue;

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcKxPLUm13QWQBV9sOaymcUOhwrb6F350CEgikiolcIxAp2k4rEjj2GmYwN8lPpAEa/exec";

createApp({
    setup() {
        // --- DATA ---
        const loading = ref(false);
        const searchQuery = ref("");
        const activeMenu = ref("Dashboard");
        const performanceStatus = ref("Excellent");
        const activity = ref([]);
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

        // --- COMPUTED ---
        const filteredActivity = computed(() => {
            if (!searchQuery.value) return activity.value;
            const q = searchQuery.value.toLowerCase();
            return activity.value.filter(a => 
                (a.content && a.content.toLowerCase().includes(q)) || 
                a.type.toLowerCase().includes(q)
            );
        });

        // --- METHODS ---
        const formatTime = (dateStr) => {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const syncData = async () => {
            loading.value = true;
            try {
                const res = await fetch(`${GOOGLE_SCRIPT_URL}?cb=${Date.now()}`);
                const data = await res.json();
                
                // Update Stats
                stats.value[0].value = data.stats.visits;
                stats.value[1].value = data.stats.questions;
                stats.value[2].value = data.stats.unanswered;

                // Update Activity
                activity.value = data.activity;

                // Update Chart
                updateChart(data.stats.visits);
                
                console.log("Vue Dashboard: Data synced.");
            } catch (e) {
                console.error("Sync error", e);
            } finally {
                loading.value = false;
            }
        };

        const initChart = () => {
            const ctx = document.getElementById('performanceChart').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 210, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Visits',
                        data: [120, 150, 180, 140, 210, 250, 300], // Default data
                        borderColor: '#00d2ff',
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        };

        const updateChart = (totalVisits) => {
            if (!chart) return;
            // Simulated variation based on total
            const base = totalVisits / 10;
            const newData = Array.from({length: 7}, () => Math.floor(base + Math.random() * base));
            chart.data.datasets[0].data = newData;
            chart.update();
        };

        // --- LIFECYCLE ---
        onMounted(() => {
            initChart();
            syncData();
            // Refrescar cada 5 minutos para evitar saturación y parpadeos
            setInterval(syncData, 300000); 
        });

        return {
            loading, searchQuery, activeMenu, stats, 
            menuItems, filteredActivity, formatTime, 
            syncData, performanceStatus
        };
    }
}).mount('#app');
