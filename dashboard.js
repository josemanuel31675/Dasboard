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
                
                stats.value[0].value = data.stats.visits || 0;
                stats.value[1].value = data.stats.questions || 0;
                stats.value[2].value = data.stats.unanswered || 0;
                activity.value = data.activity || [];

                if (chart) {
                    const base = (data.stats.visits || 100) / 10;
                    chart.data.datasets[0].data = Array.from({length: 7}, () => Math.floor(base + Math.random() * base));
                    chart.update();
                }
            } catch (e) {
                console.error("Dashboard Sync Error:", e);
            } finally {
                loading.value = false;
            }
        };

        const initChart = () => {
            const canvas = document.getElementById('performanceChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 210, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');

            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Visits',
                        data: [65, 80, 70, 95, 85, 110, 130],
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
            currentTheme, themes, setTheme
        };
    }
}).mount('#app');
